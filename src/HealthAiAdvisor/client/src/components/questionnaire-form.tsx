import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

const questionnaireSchema = z.object({
  age: z.number().min(13).max(120),
  gender: z.string().min(1, "Please select a gender"),
  height: z.number().min(1).max(300),
  weight: z.number().min(1).max(500),
  isImperial: z.boolean(),
  goals: z.array(z.string()).min(1, "Please select at least one health goal"),
  currentSupplements: z.string().optional(),
  medicalConditions: z.string().optional(),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

interface QuestionnaireFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const healthGoals = [
  { id: "energy", label: "Boost Energy", description: "Combat fatigue and increase vitality" },
  { id: "immunity", label: "Immune Support", description: "Strengthen immune system" },
  { id: "muscle", label: "Muscle Building", description: "Support muscle growth and recovery" },
  { id: "cognitive", label: "Brain Health", description: "Enhance focus and memory" },
  { id: "heart", label: "Heart Health", description: "Support cardiovascular wellness" },
  { id: "bone", label: "Bone Health", description: "Strengthen bones and joints" },
  { id: "skin", label: "Skin Health", description: "Improve skin appearance and health" },
  { id: "sleep", label: "Better Sleep", description: "Improve sleep quality and duration" },
];

export function QuestionnaireForm({ formData, setFormData }: QuestionnaireFormProps) {
  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      age: formData.age || 0,
      gender: formData.gender || "",
      height: formData.height || 0,
      weight: formData.weight || 0,
      isImperial: formData.isImperial || false,
      goals: formData.goals || [],
      currentSupplements: formData.currentSupplements || "",
      medicalConditions: formData.medicalConditions || "",
    },
  });

  // Watch form changes and update parent state
  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData]);

  const isImperial = form.watch("isImperial");

  return (
    <div className="space-y-8">
      <Form {...form}>
        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="25"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Measurement Unit Toggle */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isImperial"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Use Imperial Units (feet/inches, pounds)
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Height ({isImperial ? "inches total" : "cm"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={isImperial ? "70 (5'10\")" : "170"}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Weight ({isImperial ? "lbs" : "kg"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={isImperial ? "150" : "70"}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Health Goals */}
        <FormField
          control={form.control}
          name="goals"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Health Goals</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select all that apply to help us provide personalized recommendations.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthGoals.map((goal) => (
                  <FormField
                    key={goal.id}
                    control={form.control}
                    name="goals"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={goal.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(goal.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, goal.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== goal.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              {goal.label}
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              {goal.description}
                            </p>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Information */}
        <div className="grid md:grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="currentSupplements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Supplements (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List any vitamins, minerals, or supplements you currently take..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medicalConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medical Conditions (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List any medical conditions, allergies, or medications..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}