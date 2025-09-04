import crypto from "crypto";

type UploadParams = {
  bucket?: string;
  region?: string;
  keyPrefix?: string;
};

export function parseBase64DataUrl(dataUrl: string): { mime: string; buffer: Buffer; ext: string } {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid base64 data URL");
  }
  const mime = match[1];
  const b64 = match[2];
  const buffer = Buffer.from(b64, "base64");
  const ext = mime.split("/")[1] || "bin";
  return { mime, buffer, ext };
}

export async function uploadBase64ToS3(dataUrl: string, opts: UploadParams = {}): Promise<string> {
  const bucket = opts.bucket || process.env.AWS_S3_BUCKET;
  const region = opts.region || process.env.AWS_REGION || "us-east-1";
  if (!bucket) throw new Error("AWS_S3_BUCKET env is required");

  const { mime, buffer, ext } = parseBase64DataUrl(dataUrl);

  // Lazy import to keep TS happy without types installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod: any = await import("@aws-sdk/client-s3").catch(() => null);
  if (!mod) throw new Error("@aws-sdk/client-s3 is not installed");
  const { S3Client, PutObjectCommand } = mod as any;

  const client = new S3Client({ region });
  const key = `${opts.keyPrefix || "blogs"}/${new Date().getFullYear()}/${
    new Date().getMonth() + 1
  }/${crypto.randomUUID()}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mime,
      ACL: "public-read",
    })
  );

  const base = region === "us-east-1" ? `https://${bucket}.s3.amazonaws.com` : `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${base}/${key}`;
}

export async function replaceInlineBase64Images(html: string, opts: UploadParams = {}): Promise<string> {
  if (!html) return html;
  const imgSrcRegex = /(<img\s+[^>]*src=["'])(data:image\/[^"']+)(["'][^>]*>)/gi;

  let match: RegExpExecArray | null;
  const uploads: Array<Promise<{ from: string; to: string }>> = [];

  const b64s = new Set<string>();
  while ((match = imgSrcRegex.exec(html)) !== null) {
    const dataUrl = match[2];
    if (dataUrl.startsWith("data:image/") && !b64s.has(dataUrl)) {
      b64s.add(dataUrl);
      uploads.push(
        uploadBase64ToS3(dataUrl, opts).then((url) => ({ from: dataUrl, to: url }))
      );
    }
  }

  const results = await Promise.all(uploads);
  let out = html;
  for (const { from, to } of results) {
    out = out.split(from).join(to);
  }
  return out;
}

