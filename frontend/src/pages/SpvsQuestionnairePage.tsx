import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppLayout } from "../components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";

import { useAuth } from "../lib/auth";
import {
  fetchSpvsQuestionnaireQuestions,
  fetchSpvsQuestionnaireResponse,
  saveSpvsQuestionnaireResponse,
  type SpvsQuestionnaireQuestion,
  type SpvsQuestionnaireAnswersResponse
} from "../lib/api";

type AnswerState = Record<string, boolean>;

const QUESTION_CACHE_KEY = ["spvs", "questionnaire", "questions"];

const LEVEL_LABELS: Record<string, string> = {
  L1: "Level 1 – Foundational",
  L2: "Level 2 – Standard",
  L3: "Level 3 – Advanced"
};

export function SpvsQuestionnairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<AnswerState>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: QUESTION_CACHE_KEY,
    queryFn: fetchSpvsQuestionnaireQuestions
  });

  const {
    data: existingResponse,
    isLoading: isLoadingResponse
  } = useQuery({
    queryKey: ["spvs", "questionnaire", user?.id],
    queryFn: () => fetchSpvsQuestionnaireResponse(user!.id),
    enabled: Boolean(user)
  });

  const mutation = useMutation({
    mutationFn: (payload: { answers: AnswerState }) =>
      saveSpvsQuestionnaireResponse({
        userId: user!.id,
        answers: payload.answers
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["spvs", "questionnaire", user?.id], data);
      setHasSubmitted(true);
    }
  });

  useEffect(() => {
    if (existingResponse?.answers) {
      setAnswers(existingResponse.answers);
      setHasSubmitted(true);
    } else {
      setAnswers({});
      setHasSubmitted(false);
    }
  }, [existingResponse]);

  const questions: SpvsQuestionnaireQuestion[] = useMemo(
    () => questionsData?.questions ?? [],
    [questionsData]
  );

  const handleAnswerChange = (questionId: string, value: boolean) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ answers });
  };

  const recommendation = existingResponse?.recommendations;

  const handleApplyRecommendation = () => {
    if (!recommendation) return;
    navigate("/spvs/requirements", {
      state: {
        recommendedFilters: {
          levels: [recommendation.level],
          categories: recommendation.focusCategories,
          subcategories: recommendation.focusSubcategories
        }
      }
    });
  };

  if (!user) return null;

  return (
    <AppLayout
      title="SPVS questionnaire"
      subtitle="Discover which Secure Pipeline Verification controls to prioritise across your CI/CD tooling."
    >
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Describe the pipeline</CardTitle>
            <CardDescription>
              We use your responses to recommend SPVS levels, focus areas, and relevant control families.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingQuestions || isLoadingResponse ? (
              <p className="text-sm text-muted-foreground">Loading SPVS questionnaire…</p>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <div>
                      <h3 className="text-sm font-medium leading-none">{question.text}</h3>
                      {question.helpText && (
                        <p className="text-xs text-muted-foreground">{question.helpText}</p>
                      )}
                    </div>
                    <ToggleGroup
                      type="single"
                      value={
                        answers.hasOwnProperty(question.id)
                          ? answers[question.id]
                            ? "yes"
                            : "no"
                          : undefined
                      }
                      onValueChange={(value: string) => {
                        if (!value) return;
                        handleAnswerChange(question.id, value === "yes");
                      }}
                      className="flex gap-2"
                    >
                      <ToggleGroupItem value="yes" className="flex-1">
                        Yes
                      </ToggleGroupItem>
                      <ToggleGroupItem value="no" className="flex-1">
                        No
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                ))}

                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Responses are stored for <span className="font-medium">{user.name}</span> (
                    {user.email}) and can be updated whenever the pipeline evolves.
                  </div>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving…" : hasSubmitted ? "Update responses" : "Save responses"}
                  </Button>
                </CardFooter>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Insights refresh automatically once you save responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendation ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Suggested SPVS level
                    </Label>
                    <Badge>{LEVEL_LABELS[recommendation.level] ?? recommendation.level}</Badge>
                  </div>

                  {recommendation.focusCategories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Focus categories
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.focusCategories.map((category) => (
                          <Badge key={category} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendation.focusSubcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">
                        High-priority sub-categories
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.focusSubcategories.map((subcategory) => (
                          <Badge key={subcategory} variant="secondary">
                            {subcategory}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendation.notes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Notes</Label>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {recommendation.notes.map((note, index) => (
                          <li key={index}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Save questionnaire responses to generate SPVS level guidance and focus areas.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!recommendation}
                onClick={handleApplyRecommendation}
              >
                Apply to SPVS requirements
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why this matters</CardTitle>
              <CardDescription>
                SPVS emphasises hardening the people, tooling, and automation that power your releases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Hosted runners, IaC automation, and third-party plug-ins elevate supply-chain risk. Responses
                help prioritise controls across Plan, Develop, Integrate, Release, and Operate stages.
              </p>
              <p>
                Recommendations highlight categories and sub-categories so you can filter the requirements explorer
                and export just the controls that matter for your pipeline.
              </p>
              <p>
                Revisit this questionnaire as your delivery model changes to keep compliance and operational baselines
                in lock-step with engineering reality.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
