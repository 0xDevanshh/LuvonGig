import { NextRequest, NextResponse } from 'next/server';
import { deliverablesDb, initializeDeliverablesTables } from '@/lib/db/deliverables-db';
import { getSession } from '@/lib/auth';
import { uploadFile } from '@/lib/r2-storage';

// Initialize tables on first load
let tablesInitialized = false;

export async function GET(request: NextRequest) {
    try {
        if (!tablesInitialized) {
            await initializeDeliverablesTables();
            tablesInitialized = true;
        }

        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get('bookingId');

        if (!bookingId) {
            return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
        }

        const deliverables = await deliverablesDb.getDeliverablesByBooking(bookingId);
        return NextResponse.json({ success: true, data: deliverables });
    } catch (error: any) {
        console.error('Error fetching deliverables:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!tablesInitialized) {
            await initializeDeliverablesTables();
            tablesInitialized = true;
        }

        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const bookingId = formData.get('bookingId') as string;
        const title = formData.get('title') as string;
        let notes = formData.get('notes') as string;
        const file = formData.get('file') as File;

        if (!bookingId || (!file && !formData.get('link'))) {
            return NextResponse.json({ success: false, error: 'Booking ID and file/link are required' }, { status: 400 });
        }

        let fileUrl = formData.get('link') as string;
        let fileName = formData.get('fileName') as string || 'Link';
        let fileSize = 0;
        let fileType = 'link';

        if (file) {
            // Upload to Cloudflare R2
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadPath = `deliverables/${bookingId}/${Date.now()}-${file.name}`;
            fileUrl = await uploadFile(buffer, uploadPath, file.type);
            fileName = file.name;
            fileSize = file.size;
            fileType = file.type;

            // If a link was also provided, append it to notes so it's not lost
            const providedLink = formData.get('link') as string;
            if (providedLink) {
                notes = notes ? `${notes}\n\nRelated Link: ${providedLink}` : `Related Link: ${providedLink}`;
            }
        }

        const deliverable = await deliverablesDb.addDeliverable({
            booking_id: bookingId,
            freelancer_email: session.email,
            title,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            notes,
        });

        // Also record a status update in history
        await deliverablesDb.addStatusUpdate({
            booking_id: bookingId,
            status: 'Deliverable Submitted',
            updated_by: session.email,
            notes: `Submitted deliverable: ${title || fileName}`,
        });

        return NextResponse.json({ success: true, data: deliverable });
    } catch (error: any) {
        console.error('Error submitting deliverable:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
