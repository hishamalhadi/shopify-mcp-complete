import { z } from "zod";

// Get themes input
export const GetThemesInputSchema = z.object({
  roles: z
    .array(z.enum(["MAIN", "UNPUBLISHED", "DEVELOPMENT"]))
    .optional()
    .describe("Filter by theme roles (MAIN = published, UNPUBLISHED = drafts, DEVELOPMENT = dev themes)"),
});

// Get theme files input
export const GetThemeFilesInputSchema = z.object({
  themeId: z.string().min(1).describe("Theme ID or GID"),
  filenames: z
    .array(z.string())
    .optional()
    .describe("Specific filenames to retrieve (supports wildcards like 'templates/*.json'). If omitted, returns all files."),
  limit: z.number().min(1).max(250).default(50).describe("Maximum number of files to return"),
});

// Update theme files input
export const UpdateThemeFilesInputSchema = z.object({
  themeId: z.string().min(1).describe("Theme ID or GID"),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).describe("File path (e.g., 'templates/page.about.json', 'sections/header.liquid')"),
        content: z.string().describe("File content (text for liquid/json files)"),
      })
    )
    .min(1)
    .max(50)
    .describe("Files to create or update (max 50 per request)"),
});

// Delete theme files input
export const DeleteThemeFilesInputSchema = z.object({
  themeId: z.string().min(1).describe("Theme ID or GID"),
  files: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Filenames to delete (max 50 per request)"),
});

export type GetThemesInput = z.infer<typeof GetThemesInputSchema>;
export type GetThemeFilesInput = z.infer<typeof GetThemeFilesInputSchema>;
export type UpdateThemeFilesInput = z.infer<typeof UpdateThemeFilesInputSchema>;
export type DeleteThemeFilesInput = z.infer<typeof DeleteThemeFilesInputSchema>;
