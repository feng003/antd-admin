import { importPage } from "nextra/pages";
import type { ReactNode } from "react";
import { useMDXComponents as getMDXComponents } from "../../../mdx-components";

const Wrapper =
  getMDXComponents().wrapper ?? ((props: { children?: ReactNode }) => <>{props.children}</>);

type PageProps = { params: Promise<{ lang: string; mdxPath?: string[] }> };

function normalizePath(pathSegments?: string[]) {
  return (pathSegments ?? []).filter((segment): segment is string => Boolean(segment));
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const mdxPath = normalizePath(params.mdxPath);
  const { metadata } = await importPage(mdxPath, params.lang);
  return metadata;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const mdxPath = normalizePath(params.mdxPath);
  const pageData = await importPage(mdxPath, params.lang);
  const MDXContent = pageData.default ?? (() => null);
  const { toc, metadata, sourceCode } = pageData;

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
