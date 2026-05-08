import SharePreview from "@/components/share/SharePreview";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  return <SharePreview shareId={shareId} />;
}
