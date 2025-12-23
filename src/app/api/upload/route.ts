import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { put } from '@vercel/blob';

// For local development - filesystem upload
async function uploadToLocalFilesystem(file: File): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const fileName = `${timestamp}_${randomString}.${fileExtension}`;
  const filePath = join(uploadsDir, fileName);

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  // Return the public URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${fileName}`;
}

// For production - Vercel Blob Storage
async function uploadToVercelBlob(file: File): Promise<string> {
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const fileName = `uploads/${timestamp}_${randomString}.${fileExtension}`;

  const blob = await put(fileName, file, {
    access: 'public',
    addRandomSuffix: false, // We're already adding random suffix
  });

  return blob.url;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPPLIER_USER' && session.role !== 'ADMIN' && session.role !== 'VENDOR_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Prefer Vercel Blob Storage if token is available (works in both dev and production)
    // This ensures consistency between local and production environments
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    let fileUrl: string;

    if (hasBlobToken) {
      // Use Vercel Blob Storage (preferred - works in both dev and production)
      try {
        fileUrl = await uploadToVercelBlob(file);
        console.log('File uploaded to Vercel Blob:', fileUrl);
      } catch (blobError) {
        console.error('Vercel Blob upload failed, falling back to local filesystem:', blobError);
        // Fallback to local filesystem if blob fails
        fileUrl = await uploadToLocalFilesystem(file);
      }
    } else {
      // Use local filesystem only if Blob token is not available
      fileUrl = await uploadToLocalFilesystem(file);
      console.log('File uploaded to local filesystem (Blob token not set):', fileUrl);
    }

    // Extract filename for response
    const fileName = fileUrl.split('/').pop() || '';

    console.log('File uploaded successfully:', {
      fileName,
      fileUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      storage: hasBlobToken ? 'vercel-blob' : 'local-filesystem'
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName,
      url: fileUrl,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
