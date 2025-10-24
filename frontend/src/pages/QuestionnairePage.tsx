import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  fetchQuestionnaireQuestions,
  fetchQuestionnaireResponse,
  saveQuestionnaireResponse
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { QuestionnaireQuestion, QuestionnaireAnswersResponse } from "../lib/questionnaire";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { getDisciplineLabel, getTechnologyLabel } from "../lib/developerOptions";
import { ROLE_LABELS } from "../lib/roles";
import { ASVS_LEVELS, APPLICATION_TYPES } from "../lib/asvs";

type AnswerState = Record<string, boolean>;

const QUESTION_CACHE_KEY = ["questionnaire", "questions"];

export function QuestionnairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<AnswerState>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: QUESTION_CACHE_KEY,
    queryFn: fetchQuestionnaireQuestions
  });

  const {
    data: existingResponse,
    isLoading: isLoadingResponse
  } = useQuery({
    queryKey: ["questionnaire", user?.id],
    queryFn: () => fetchQuestionnaireResponse(user!.id),
    enabled: Boolean(user)
  });

  const mutation = useMutation({
    mutationFn: (payload: { answers: AnswerState }) =>
      saveQuestionnaireResponse({
        userId: user!.id,
        role: user!.role,
        answers: payload.answers
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["questionnaire", user?.id], data);
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

  const questions: QuestionnaireQuestion[] = useMemo(
    () => questionsData?.questions ?? [],
    [questionsData]
  );

  const handleAnswerChange = (questionId: string, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ answers });
  };

  const recommendation = existingResponse?.recommendations;

  const handleApplyToChecklist = () => {
    if (!recommendation) return;
    navigate("/checklist", {
      state: {
        recommendedFilters: {
          level: recommendation.level,
          applicationType: recommendation.applicationType,
          discipline: recommendation.discipline,
          technology: recommendation.technology
        }
      }
    });
  };

  if (!user) return null;

  return (
    <AppLayout
      title="Questionnaire"
      subtitle="Capture context about your application to tailor ASVS guidance and checklist filters."
    >
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tell us about the application</CardTitle>
            <CardDescription>
              Answer a few design-review style questions to receive a recommended ASVS level and focus
              areas. You can edit your responses at any time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingQuestions || isLoadingResponse ? (
              <p className="text-sm text-muted-foreground">Loading questionnaire…</p>
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
                    {user.email}) and can be updated at any time.
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
                Suggestions update automatically once you save the questionnaire.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendation ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Suggested level</Label>
                    <Badge>{ASVS_LEVELS.find((l) => l.value === recommendation.level)?.label ?? recommendation.level}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Suggested application type
                    </Label>
                    <Badge>
                      {APPLICATION_TYPES.find((type) => type.value === recommendation.applicationType)
                        ?.label ?? recommendation.applicationType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Suggested discipline
                    </Label>
                    <Badge>{getDisciplineLabel(recommendation.discipline)}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Suggested technology
                    </Label>
                    <Badge>
                      {recommendation.technology === "all"
                        ? "Any / TBD"
                        : getTechnologyLabel(recommendation.technology)}
                    </Badge>
                  </div>
                  {recommendation.recommendedCategories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Focus ASVS categories
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.recommendedCategories.map((category) => (
                          <Badge key={category} variant="outline">
                            {category}
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
                  Save questionnaire responses to generate level and requirement guidance.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!recommendation}
                onClick={handleApplyToChecklist}
              >
                Apply to checklist
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why we ask</CardTitle>
              <CardDescription>
                These questions mirror typical secure design reviews and help select the right ASVS
                coverage without over- or under-scoping.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Risk-heavy responses (payments, PII, external exposure) push the recommendation toward
                ASVS Level 2 or 3, while internal, low-risk applications stay closer to Level 1.
              </p>
              <p>
                We map your answers to relevant ASVS categories (e.g., input validation, data protection,
                supply-chain) so checklist filters highlight the controls that matter most.
              </p>
              <p>
                If your scope changes, revisit this questionnaire and refresh the recommendation to keep
                your security activities aligned with the latest design decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
