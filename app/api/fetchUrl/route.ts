import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: 0, message: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: 0, message: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Return the URL as is - Editor.js will use it directly
    return NextResponse.json({
      success: 1,
      file: {
        url: url,
      },
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { success: 0, message: 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}
