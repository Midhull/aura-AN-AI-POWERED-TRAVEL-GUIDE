import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DestinationSearchEngine, DestinationService } from "./destinationIntel";

export const queryDestinations = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      query: z.string().optional(),
      maxBudget: z.number().optional(),
      interests: z.array(z.string()).optional(),
      style: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    return await DestinationSearchEngine.search(data);
  });

export const getDestinationInfo = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      destinationId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    return await DestinationService.getFullDestinationData(data.destinationId);
  });
