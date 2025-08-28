const { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_BUCKET_NAME;

if (!REGION) {
  console.error("❌ AWS_REGION is not defined in .env");
}
if (!BUCKET) {
  console.error("❌ AWS_BUCKET_NAME is not defined in .env");
}

const s3 = new S3Client({ region: REGION });

// ✅ List all images in bucket
async function listImages() {
  const command = new ListObjectsV2Command({ Bucket: BUCKET });
  const data = await s3.send(command);

  return await Promise.all(
    (data.Contents || []).map(async (obj) => {
      const url = await getPresignedUrl(obj.Key);
      return {
        Key: obj.Key,
        Size: obj.Size,
        LastModified: obj.LastModified,
        Url: url   // ✅ Use presigned URL
      };
    })
  );
}

// ✅ Get presigned URL for a single object
async function getPresignedUrl(key, expiresInSeconds = 900) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return await getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

// ✅ Upload buffer
async function uploadBuffer(buffer, key, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });
  return await s3.send(cmd);
}

// ✅ Delete object
async function deleteObject(key) {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return await s3.send(cmd);
}

module.exports = { s3, listImages, getPresignedUrl, uploadBuffer, deleteObject };
