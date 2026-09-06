import { sdk } from "@/lib/sdk";
import { unwrap } from "@/features/planner/queries";
import type { paths } from "../../../../../sdk/src/generated/schema";

export type CreateScenarioBody = NonNullable<
  paths["/api/v1/scenarios"]["post"]["requestBody"]
>["content"]["application/json"];

export type UpdateScenarioBody = NonNullable<
  paths["/api/v1/scenarios/{id}"]["patch"]["requestBody"]
>["content"]["application/json"];

export type ApplyScenarioBody = NonNullable<
  paths["/api/v1/scenarios/{id}/apply"]["post"]["requestBody"]
>["content"]["application/json"];

export type ScenarioDomainInputs = CreateScenarioBody["overlay"];

export async function createScenario(body: CreateScenarioBody) {
  const response = await sdk.POST("/api/v1/scenarios", { body });
  return unwrap(response).data;
}

export async function updateScenario(id: string, body: UpdateScenarioBody) {
  const response = await sdk.PATCH("/api/v1/scenarios/{id}", {
    params: { path: { id } },
    body,
  });
  return unwrap(response).data;
}

export async function runScenario(id: string) {
  const response = await sdk.POST("/api/v1/scenarios/{id}/run", {
    params: { path: { id } },
  });
  return unwrap(response).data;
}

export async function applyScenario(id: string, body: ApplyScenarioBody = {}) {
  const response = await sdk.POST("/api/v1/scenarios/{id}/apply", {
    params: { path: { id } },
    body,
  });
  return unwrap(response).data;
}
