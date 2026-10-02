import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | TemplateValue[]
  | { [key: string]: TemplateValue };

export type TemplateData = { [key: string]: TemplateValue };

export type ParseOptions = {
  locale?: string;
  fallbackLocale?: string;
};

export type ParseResult = {
  output: string;
  warnings: string[];
};

type Token = { kind: "text"; value: string } | { kind: "tag"; value: string };

type Node =
  | { kind: "text"; value: string }
  | { kind: "value"; path: string }
  | { kind: "partial"; name: string }
  | {
      kind: "block";
      name: "if" | "each";
      path: string;
      truthy: Node[];
      falsy: Node[];
    };

type ParseNodesResult = {
  nodes: Node[];
  nextIndex: number;
  stop: "else" | "close" | "end";
};

const TOKEN_PATTERN = /{{([\s\S]*?)}}/g;

const isRecord = (
  value: TemplateValue
): value is {
  [key: string]: TemplateValue;
} => typeof value === "object" && value !== null && !Array.isArray(value);

const isLocaleMap = (value: TemplateValue): value is Record<string, string> => {
  if (!isRecord(value)) return false;

  const values = Object.values(value);
  return (
    values.length > 0 &&
    values.every((item) => typeof item === "string") &&
    Object.keys(value).some((key) => key.length === 2 || key.includes("-"))
  );
};

const localize = (
  value: TemplateValue,
  locale: string,
  fallbackLocale: string,
  path: string,
  warnings: Set<string>
): TemplateValue => {
  if (isLocaleMap(value)) {
    if (value[locale] !== undefined) return value[locale];

    if (value[fallbackLocale] !== undefined) {
      warnings.add(`Missing ${locale} translation at ${path}; used ${fallbackLocale}.`);
      return value[fallbackLocale];
    }

    const firstLocale = Object.keys(value)[0];
    warnings.add(`Missing ${locale} translation at ${path}; used ${firstLocale}.`);
    return value[firstLocale];
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      localize(item, locale, fallbackLocale, `${path}[${index}]`, warnings)
    );
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        localize(item, locale, fallbackLocale, path ? `${path}.${key}` : key, warnings)
      ])
    );
  }

  return value;
};

const tokenize = (template: string): Token[] => {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex)
      tokens.push({ kind: "text", value: template.slice(lastIndex, index) });
    tokens.push({ kind: "tag", value: match[1].trim() });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < template.length)
    tokens.push({ kind: "text", value: template.slice(lastIndex) });
  return tokens;
};

const parseNodes = (
  tokens: Token[],
  startIndex: number,
  closingName?: string
): ParseNodesResult => {
  const nodes: Node[] = [];
  let index = startIndex;

  while (index < tokens.length) {
    const token = tokens[index];
    index += 1;

    if (token.kind === "text") {
      nodes.push({ kind: "text", value: token.value });
      continue;
    }

    if (token.value === "else") return { nodes, nextIndex: index, stop: "else" };

    if (token.value.startsWith("/")) {
      const name = token.value.slice(1).trim();
      if (name !== closingName) throw new Error(`Unexpected closing tag: {{/${name}}}`);
      return { nodes, nextIndex: index, stop: "close" };
    }

    if (token.value.startsWith("#")) {
      const [name, ...pathParts] = token.value.slice(1).trim().split(/\s+/);
      if (name !== "if" && name !== "each")
        throw new Error(`Unsupported block: {{#${name}}}`);

      const path = pathParts.join(" ");
      const truthy = parseNodes(tokens, index, name);
      index = truthy.nextIndex;
      let falsy: Node[] = [];

      if (truthy.stop === "else") {
        const inverse = parseNodes(tokens, index, name);
        falsy = inverse.nodes;
        index = inverse.nextIndex;
        if (inverse.stop !== "close")
          throw new Error(`Missing closing tag for {{#${name}}}`);
      } else if (truthy.stop !== "close") {
        throw new Error(`Missing closing tag for {{#${name}}}`);
      }

      nodes.push({ kind: "block", name, path, truthy: truthy.nodes, falsy });
      continue;
    }

    if (token.value.startsWith(">")) {
      const name = token.value.slice(1).trim();
      if (!name) throw new Error("Partial name cannot be empty.");
      nodes.push({ kind: "partial", name });
      continue;
    }

    nodes.push({ kind: "value", path: token.value });
  }

  if (closingName) throw new Error(`Missing closing tag for {{#${closingName}}}`);
  return { nodes, nextIndex: index, stop: "end" };
};

const getPath = (context: TemplateValue, path: string): TemplateValue | undefined => {
  if (path === "this" || path === ".") return context;
  if (path.startsWith("this.")) path = path.slice(5);

  return path.split(".").reduce<TemplateValue | undefined>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, context);
};

const isTruthy = (value: TemplateValue | undefined) => {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

const renderNodes = (
  nodes: Node[],
  context: TemplateValue,
  partials: Record<string, string>,
  warnings: Set<string>
): string => {
  return nodes
    .map((node) => {
      if (node.kind === "text") return node.value;

      if (node.kind === "value") {
        const value = getPath(context, node.path);
        return value === undefined || value === null ? "" : String(value);
      }

      if (node.kind === "partial") {
        const partial = partials[node.name];
        if (partial === undefined) {
          warnings.add(`Missing partial: ${node.name}.`);
          return "";
        }
        return renderNodes(
          parseNodes(tokenize(partial), 0).nodes,
          context,
          partials,
          warnings
        );
      }

      const value = getPath(context, node.path);
      if (node.name === "each") {
        if (!Array.isArray(value) || value.length === 0) {
          return renderNodes(node.falsy, context, partials, warnings);
        }
        return value
          .filter((item) => !isRecord(item) || item.enabled !== false)
          .map((item) => renderNodes(node.truthy, item, partials, warnings))
          .join("");
      }

      return renderNodes(
        isTruthy(value) ? node.truthy : node.falsy,
        context,
        partials,
        warnings
      );
    })
    .join("");
};

export const parseTemplate = (
  template: string,
  data: TemplateData,
  partials: Record<string, string> = {},
  options: ParseOptions = {}
): ParseResult => {
  const locale = options.locale ?? String(data.locale ?? "en");
  const fallbackLocale = options.fallbackLocale ?? "en";
  const warningSet = new Set<string>();
  const localizedData = localize(
    data,
    locale,
    fallbackLocale,
    "",
    warningSet
  );
  const ast = parseNodes(tokenize(template), 0).nodes;

  return {
    output: renderNodes(ast, localizedData, partials, warningSet),
    warnings: [...warningSet]
  };
};

const runCli = async () => {
  const root = dirname(new URL(import.meta.url).pathname);
  const assets = resolve(root, "../site/src/assets");
  const template = await readFile(resolve(assets, "default-resume-template.md"), "utf8");
  const data = JSON.parse(
    await readFile(resolve(assets, "default-resume-data.json"), "utf8")
  ) as TemplateData;
  const partialNames = ["skills", "hobbies"];
  const partials = Object.fromEntries(
    await Promise.all(
      partialNames.map(async (name) => [
        name,
        await readFile(resolve(root, "partials", `${name}.md`), "utf8")
      ])
    )
  );
  const result = parseTemplate(template, data, partials);
  await writeFile(resolve(root, "resume.generated.md"), result.output);

  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
};

if (import.meta.url === `file://${process.argv[1]}`) await runCli();
