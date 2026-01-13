import { GraphQLClient } from "graphql-request";
import {
  GetThemesInputSchema,
  GetThemeFilesInputSchema,
  UpdateThemeFilesInputSchema,
  DeleteThemeFilesInputSchema,
} from "../schemas/themes.js";
import {
  GET_THEMES,
  GET_THEME_FILES,
  THEME_FILES_UPSERT,
  THEME_FILES_DELETE,
} from "../graphql/index.js";

// Helper to convert ID to GID format
function toThemeGid(id: string): string {
  if (id.includes("gid://")) return id;
  return `gid://shopify/OnlineStoreTheme/${id}`;
}

export function createThemeTools(client: GraphQLClient) {
  return {
    "get-themes": {
      description:
        "List all themes in the store. Returns theme ID, name, role (MAIN=published, UNPUBLISHED=draft), and status. Use this to find theme IDs for other operations.",
      schema: GetThemesInputSchema,
      handler: async (input: unknown) => {
        const params = GetThemesInputSchema.parse(input);

        const data = await client.request<{
          themes: {
            nodes: Array<{
              id: string;
              name: string;
              role: string;
              createdAt: string;
              updatedAt: string;
              processing: boolean;
              processingFailed: boolean;
            }>;
          };
        }>(GET_THEMES, {
          first: 50,
          roles: params.roles || null,
        });

        return {
          themes: data.themes.nodes,
        };
      },
    },

    "get-theme-files": {
      description:
        "Read theme files (templates, sections, assets, config). Returns file content for liquid and JSON files. Use wildcards like 'templates/*.json' or 'sections/*.liquid' to filter files.",
      schema: GetThemeFilesInputSchema,
      handler: async (input: unknown) => {
        const params = GetThemeFilesInputSchema.parse(input);
        const themeId = toThemeGid(params.themeId);

        const data = await client.request<{
          theme: {
            id: string;
            name: string;
            role: string;
            files: {
              nodes: Array<{
                filename: string;
                size: number;
                body:
                  | { content: string }
                  | { contentBase64: string }
                  | { url: string }
                  | null;
              }>;
              pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
              };
            };
          } | null;
        }>(GET_THEME_FILES, {
          id: themeId,
          filenames: params.filenames || null,
          first: params.limit,
        });

        if (!data.theme) {
          throw new Error(`Theme not found: ${themeId}`);
        }

        // Transform file bodies to a simpler format
        const files = data.theme.files.nodes.map((file) => {
          let content: string | null = null;
          let contentType: "text" | "base64" | "url" = "text";

          if (file.body) {
            if ("content" in file.body) {
              content = file.body.content;
              contentType = "text";
            } else if ("contentBase64" in file.body) {
              content = file.body.contentBase64;
              contentType = "base64";
            } else if ("url" in file.body) {
              content = file.body.url;
              contentType = "url";
            }
          }

          return {
            filename: file.filename,
            size: file.size,
            content,
            contentType,
          };
        });

        return {
          theme: {
            id: data.theme.id,
            name: data.theme.name,
            role: data.theme.role,
          },
          files,
          pageInfo: data.theme.files.pageInfo,
        };
      },
    },

    "update-theme-files": {
      description:
        "Create or update theme files (templates, sections, snippets, config, assets). Supports up to 50 files per request. Note: Requires write_themes scope and Shopify exemption for production apps.",
      schema: UpdateThemeFilesInputSchema,
      handler: async (input: unknown) => {
        const params = UpdateThemeFilesInputSchema.parse(input);
        const themeId = toThemeGid(params.themeId);

        // Transform files to the expected input format
        const files = params.files.map((file) => ({
          filename: file.filename,
          body: {
            type: "TEXT" as const,
            value: file.content,
          },
        }));

        const data = await client.request<{
          themeFilesUpsert: {
            upsertedThemeFiles: Array<{ filename: string }> | null;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(THEME_FILES_UPSERT, {
          themeId,
          files,
        });

        if (data.themeFilesUpsert.userErrors.length > 0) {
          throw new Error(
            `Failed to update theme files: ${data.themeFilesUpsert.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          updatedFiles: data.themeFilesUpsert.upsertedThemeFiles || [],
        };
      },
    },

    "delete-theme-files": {
      description:
        "Delete theme files. Supports up to 50 files per request. Note: Requires write_themes scope and Shopify exemption for production apps.",
      schema: DeleteThemeFilesInputSchema,
      handler: async (input: unknown) => {
        const params = DeleteThemeFilesInputSchema.parse(input);
        const themeId = toThemeGid(params.themeId);

        const data = await client.request<{
          themeFilesDelete: {
            deletedThemeFiles: Array<{ filename: string }> | null;
            userErrors: Array<{ field: string; message: string }>;
          };
        }>(THEME_FILES_DELETE, {
          themeId,
          files: params.files,
        });

        if (data.themeFilesDelete.userErrors.length > 0) {
          throw new Error(
            `Failed to delete theme files: ${data.themeFilesDelete.userErrors.map((e) => e.message).join(", ")}`
          );
        }

        return {
          success: true,
          deletedFiles: data.themeFilesDelete.deletedThemeFiles || [],
        };
      },
    },
  };
}
