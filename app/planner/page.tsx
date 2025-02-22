"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { generateLessonPlan, type GeneratedLessonPlan } from "@/lib/gemini";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PlannerPage() {
  const [formData, setFormData] = useState({
    topic: "",
    gradeLevel: "",
    mainConcept: "",
    subTopics: "",
    materials: "",
    objectives: "",
    lessonOutline: "",
  });

  const [generatedPlan, setGeneratedPlan] = useState<GeneratedLessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGradeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gradeLevel: value }));
  };

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError("");
    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("Please configure your Gemini API key in the environment variables.");
      }
      const plan = await generateLessonPlan(formData);
      setGeneratedPlan(plan);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate lesson plan. Please try again.";
      setError(errorMessage);
      console.error("Error generating lesson plan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !generatedPlan) return;

    try {
      const content = contentRef.current;
      const canvas = await html2canvas(content);
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`lesson-plan-${formData.topic.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Lesson Plan</h1>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Topic</label>
                <Input
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="Enter lesson topic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Grade Level</label>
                <Select onValueChange={handleGradeChange} value={formData.gradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={`grade-${i + 1}`}>
                        Grade {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Main Concept</label>
              <Textarea
                name="mainConcept"
                value={formData.mainConcept}
                onChange={handleInputChange}
                placeholder="Enter the main concept"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sub Topics</label>
              <Textarea
                name="subTopics"
                value={formData.subTopics}
                onChange={handleInputChange}
                placeholder="Enter sub topics (one per line)"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Materials Needed</label>
              <Textarea
                name="materials"
                value={formData.materials}
                onChange={handleInputChange}
                placeholder="List required materials"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Learning Objectives</label>
              <Textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                placeholder="Enter learning objectives"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lesson Outline</label>
              <Textarea
                name="lessonOutline"
                value={formData.lessonOutline}
                onChange={handleInputChange}
                placeholder="Enter lesson outline"
                className="min-h-[150px]"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleGeneratePlan}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Lesson Plan"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={!generatedPlan}
              >
                Download PDF
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </Card>

        <Card className="p-6" ref={contentRef}>
          <h2 className="text-xl font-semibold mb-4">Generated Lesson Plan</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overview">
              <AccordionTrigger>Overview</AccordionTrigger>
              <AccordionContent>
                {generatedPlan?.overview || "Generate a lesson plan to see the overview..."}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="activities">
              <AccordionTrigger>Classroom Activities</AccordionTrigger>
              <AccordionContent>
                {generatedPlan?.activities || "Generate a lesson plan to see activities..."}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="assessment">
              <AccordionTrigger>Assessment</AccordionTrigger>
              <AccordionContent>
                {generatedPlan?.assessment || "Generate a lesson plan to see assessment..."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
}