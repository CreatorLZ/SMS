# Image Upload System Implementation Guide

## Table of Contents

1. [Infrastructure Setup](#infrastructure-setup)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Security & Best Practices](#security--best-practices)
5. [Testing](#testing)

## Infrastructure Setup

### AWS Configuration

1. Create S3 bucket

```bash
aws s3 mb s3://treasure-land-uploads --region us-east-1
```

2. Enable CORS for S3 bucket:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "POST", "GET"],
      "AllowedOrigins": ["https://your-domain.com"],
      "ExposeHeaders": []
    }
  ]
}
```

3. Apply CORS configuration:

```bash
aws s3api put-bucket-cors --bucket treasure-land-uploads --cors-configuration file://cors-config.json
```

## Backend Implementation

### Required Dependencies

```bash
npm install @aws-sdk/client-s3 sharp multer uuid
```

### 1. Environment Variables

Add to `.env`:

```
AWS_BUCKET_NAME=treasure-land-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
CDN_URL=your-cdn-url
```

### 2. Configuration

```typescript
// src/config/imageConfig.ts
export const AWS_CONFIG = {
  BUCKET_NAME: process.env.AWS_BUCKET_NAME || "",
  REGION: process.env.AWS_REGION || "us-east-1",
  ACCESS_KEY: process.env.AWS_ACCESS_KEY || "",
  SECRET_KEY: process.env.AWS_SECRET_KEY || "",
  CDN_URL: process.env.CDN_URL || "",
};

export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  THUMBNAIL_SIZE: { width: 150, height: 150 },
};
```

### 3. User Model Update

```typescript
// src/models/User.ts
import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  // ...existing fields...
  profilePicture: {
    originalUrl: string;
    thumbnailUrl: string;
    key: string;
  };
}

const userSchema = new mongoose.Schema({
  // ...existing fields...
  profilePicture: {
    originalUrl: String,
    thumbnailUrl: String,
    key: String,
  },
});
```

### 4. Image Service

```typescript
// src/services/ImageService.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { AWS_CONFIG, IMAGE_CONFIG } from "../config/imageConfig";

export class ImageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: AWS_CONFIG.REGION,
      credentials: {
        accessKeyId: AWS_CONFIG.ACCESS_KEY,
        secretAccessKey: AWS_CONFIG.SECRET_KEY,
      },
    });
  }

  async uploadProfilePicture(file: Express.Multer.File, userId: string) {
    const key = `profile-pictures/original/${userId}/${uuidv4()}`;
    const thumbnailKey = `profile-pictures/thumbnails/${userId}/${uuidv4()}`;

    // Process image
    const optimizedImage = await sharp(file.buffer)
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnail = await sharp(file.buffer)
      .resize(
        IMAGE_CONFIG.THUMBNAIL_SIZE.width,
        IMAGE_CONFIG.THUMBNAIL_SIZE.height
      )
      .jpeg({ quality: 70 })
      .toBuffer();

    // Upload original
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: AWS_CONFIG.BUCKET_NAME,
        Key: key,
        Body: optimizedImage,
        ContentType: "image/jpeg",
      })
    );

    // Upload thumbnail
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: AWS_CONFIG.BUCKET_NAME,
        Key: thumbnailKey,
        Body: thumbnail,
        ContentType: "image/jpeg",
      })
    );

    return {
      originalUrl: `${AWS_CONFIG.CDN_URL}/${key}`,
      thumbnailUrl: `${AWS_CONFIG.CDN_URL}/${thumbnailKey}`,
      key,
    };
  }

  async deleteProfilePicture(key: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: AWS_CONFIG.BUCKET_NAME,
        Key: key,
      })
    );
  }
}
```

### 5. Upload Middleware

```typescript
// src/middleware/uploadMiddleware.ts
import multer from "multer";
import { IMAGE_CONFIG } from "../config/imageConfig";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: IMAGE_CONFIG.MAX_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export default upload;
```

### 6. Controller Updates

```typescript
// src/controllers/userController.ts
import { ImageService } from "../services/ImageService";

const imageService = new ImageService();

export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image if exists
    if (user.profilePicture?.key) {
      await imageService.deleteProfilePicture(user.profilePicture.key);
    }

    // Upload new image
    const imageData = await imageService.uploadProfilePicture(file, userId);

    user.profilePicture = imageData;
    await user.save();

    res.status(200).json({ profilePicture: imageData });
  } catch (error) {
    console.error("Profile picture update error:", error);
    res.status(500).json({ message: "Error updating profile picture" });
  }
};
```

### 7. Routes

```typescript
// src/routes/userRoutes.ts
import upload from "../middleware/uploadMiddleware";

router.put(
  "/:userId/profile-picture",
  upload.single("image"),
  updateProfilePicture
);
```

## Frontend Implementation

### 1. Image Upload Hook

```typescript
// src/hooks/useImageUpload.ts
import { useState } from "react";

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (userId: string, file: File) => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`/api/users/${userId}/profile-picture`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.profilePicture;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, error };
};
```

### 2. Image Upload Component

```typescript
// src/components/ImageUpload.tsx
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { IMAGE_CONFIG } from "../config/imageConfig";

interface ImageUploadProps {
  onImageSelect: (file: File) => Promise<void>;
  currentImage?: string;
  isLoading?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImage,
  isLoading,
}) => {
  const [preview, setPreview] = useState<string>(currentImage || "");
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        try {
          setError("");
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          await onImageSelect(file);
        } catch (err) {
          setError("Failed to upload image");
        }
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: IMAGE_CONFIG.MAX_SIZE,
    multiple: false,
  });

  return (
    <div className="w-full max-w-md">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 mx-auto rounded-full object-cover"
          />
        ) : (
          <p>Drag & drop or click to select image</p>
        )}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {isLoading && <p className="text-gray-500 mt-2">Uploading...</p>}
    </div>
  );
};
```

## Security & Best Practices

### Security Checklist

- [ ] Implement virus scanning using ClamAV
- [ ] Set up WAF rules for API endpoints
- [ ] Configure proper bucket policies
- [ ] Implement rate limiting
- [ ] Set up proper CORS configuration
- [ ] Validate file types on server
- [ ] Implement maximum file size limits
- [ ] Set up proper IAM roles and permissions

### Performance Optimization

- [ ] Configure CDN caching
- [ ] Implement progressive image loading
- [ ] Add retry mechanism for failed uploads
- [ ] Implement proper error handling
- [ ] Add loading states
- [ ] Optimize image quality vs size

### Monitoring

- [ ] Set up CloudWatch metrics
- [ ] Monitor S3 bucket usage
- [ ] Track upload success/failure rates
- [ ] Set up error alerting
- [ ] Monitor CDN performance

## Testing

### Unit Tests

```typescript
// tests/services/ImageService.test.ts
import { ImageService } from "../../src/services/ImageService";

describe("ImageService", () => {
  let imageService: ImageService;

  beforeEach(() => {
    imageService = new ImageService();
  });

  test("should process and upload image successfully", async () => {
    const mockFile = {
      buffer: Buffer.from("test-image"),
      mimetype: "image/jpeg",
    } as Express.Multer.File;

    const result = await imageService.uploadProfilePicture(mockFile, "user123");

    expect(result).toHaveProperty("originalUrl");
    expect(result).toHaveProperty("thumbnailUrl");
    expect(result).toHaveProperty("key");
  });
});
```

### Integration Tests

```typescript
// tests/integration/imageUpload.test.ts
import request from "supertest";
import app from "../../src/app";

describe("Image Upload Integration", () => {
  test("should upload profile picture", async () => {
    const response = await request(app)
      .put("/api/users/123/profile-picture")
      .attach("image", "test-files/test-image.jpg");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("profilePicture");
  });
});
```

## Deployment Checklist

- [ ] Configure AWS credentials
- [ ] Set up S3 bucket
- [ ] Configure CDN
- [ ] Set environment variables
- [ ] Run database migrations
- [ ] Deploy backend services
- [ ] Deploy frontend application
- [ ] Verify monitoring
- [ ] Test in staging environment
