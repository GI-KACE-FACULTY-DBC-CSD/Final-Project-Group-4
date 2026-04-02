<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = Document::with(['lecturer.user', 'session']);

        if ($request->has('session_id')) {
            $sessionId = str_replace('session-', '', $request->session_id);
            $query->where('session_id', $sessionId);
        }

        $documents = $query->get()->map(function ($document) {
            return [
                'id' => 'doc-' . $document->id,
                'name' => $document->name,
                'type' => $document->type,
                'size' => $document->size,
                'uploadedBy' => 'lecturer-' . $document->uploaded_by,
                'uploadedAt' => $document->uploaded_at->toISOString(),
                'sessionId' => 'session-' . $document->session_id,
                'url' => $document->url,
            ];
        });

        return response()->json($documents);
    }

    public function show($id)
    {
        $documentId = str_replace('doc-', '', $id);
        $document = Document::with(['lecturer.user', 'session'])->findOrFail($documentId);

        return response()->json([
            'id' => 'doc-' . $document->id,
            'name' => $document->name,
            'type' => $document->type,
            'size' => $document->size,
            'uploadedBy' => 'lecturer-' . $document->uploaded_by,
            'uploadedAt' => $document->uploaded_at->toISOString(),
            'sessionId' => 'session-' . $document->session_id,
            'url' => $document->url,
        ]);
    }
}
