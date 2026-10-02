export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | TemplateValue[]
  | { [key: string]: TemplateValue };

export type TemplateData = { [key: string]: TemplateValue };

export type TemplateParseResult = {
  output: string;
  warnings: string[];
};

type Token =
  | { kind: "text"; value: string }
  | { kind: "tag"; value: string };

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

const isRecord = (value: TemplateValue): value is Record<string, TemplateValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
    if (index > lastIndex) tokens.push({ kind: "text", value: template.slice(lastIndex, index) });
    tokens.push({ kind: "tag", value: match[1].trim() });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < template.length) tokens.push({ kind: "text", value: template.slice(lastIndex) });
  return tokens;
};

const parseNodes = (tokens: Token[], startIndex: number, closingName?: string): ParseNodesResult => {
  const nodes: Node[] = [];
  let index = startIndex;

  while (index < tokens.length) {
    const token = tokens[index++];
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
      if (name !== "if" && name !== "each") throw new Error(`Unsupported block: {{#${name}}}`);

      const truthy = parseNodes(tokens, index, name);
      index = truthy.nextIndex;
      let falsy: Node[] = [];

      if (truthy.stop === "else") {
        const inverse = parseNodes(tokens, index, name);
        falsy = inverse.nodes;
        index = inverse.nextIndex;
        if (inverse.stop !== "close") throw new Error(`Missing closing tag for {{#${name}}}`);
      } else if (truthy.stop !== "close") {
        throw new Error(`Missing closing tag for {{#${name}}}`);
      }

      nodes.push({
        kind: "block",
        name,
        path: pathParts.join(" "),
        truthy: truthy.nodes,
        falsy
      });
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

const renderNodes = (
  nodes: Node[],
  context: TemplateValue,
  partials: Record<string, string>,
  warnings: Set<string>
): string =>
  nodes
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
        return renderNodes(parseNodes(tokenize(partial), 0).nodes, context, partials, warnings);
      }

      const value = getPath(context, node.path);
      if (node.name === "each") {
        if (!Array.isArray(value) || value.length === 0) {
          return renderNodes(node.falsy, context, partials, warnings);
        }
        let visibleIndex = 0;
        return value
          .filter((item) => !isRecord(item) || item.enabled !== false)
          .map((item) => {
            const itemContext = isRecord(item)
              ? { ...item, "@even": visibleIndex % 2 === 1 }
              : item;
            const rendered = renderNodes(node.truthy, itemContext, partials, warnings);
            visibleIndex += 1;
            return rendered;
          })
          .join("");
      }

      return renderNodes(
        Boolean(value) ? node.truthy : node.falsy,
        context,
        partials,
        warnings
      );
    })
    .join("");

export const parseTemplate = (
  template: string,
  data: TemplateData,
  partials: Record<string, string> = {},
  locale = String(data.locale ?? "en"),
  fallbackLocale = "en"
): TemplateParseResult => {
  const warnings = new Set<string>();
  const localizedData = localize(data, locale, fallbackLocale, "", warnings);
  const nodes = parseNodes(tokenize(template), 0).nodes;

  return {
    output: renderNodes(nodes, localizedData, partials, warnings),
    warnings: [...warnings]
  };
};