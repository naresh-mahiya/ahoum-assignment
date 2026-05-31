"""Thin MinIO (S3-compatible) helper used for image uploads."""
import boto3
from botocore.client import Config
from django.conf import settings


def get_minio_client():
    return boto3.client(
        's3',
        endpoint_url=settings.MINIO_ENDPOINT,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1',
    )


def ensure_bucket(client=None):
    client = client or get_minio_client()
    bucket = settings.MINIO_BUCKET_NAME
    existing = [b['Name'] for b in client.list_buckets().get('Buckets', [])]
    if bucket not in existing:
        client.create_bucket(Bucket=bucket)
    return bucket


def upload_fileobj(file, key, content_type='application/octet-stream'):
    """
    Upload a file-like object to MinIO and return its public URL.

    The URL uses MINIO_PUBLIC_ENDPOINT so it resolves from the browser
    (the internal MINIO_ENDPOINT host is only reachable inside Docker).
    """
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET_NAME
    try:
        ensure_bucket(client)
    except Exception:
        pass  # bucket likely already created by the minio-init service
    client.upload_fileobj(
        file,
        bucket,
        key,
        ExtraArgs={'ContentType': content_type},
    )
    return f'{settings.MINIO_PUBLIC_ENDPOINT}/{bucket}/{key}'
