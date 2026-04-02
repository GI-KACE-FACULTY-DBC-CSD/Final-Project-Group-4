<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        $query = Alert::with(['student.user', 'session']);

        if ($request->has('read')) {
            $query->where('read', $request->read === 'true');
        }

        $alerts = $query->orderBy('timestamp', 'desc')->get()->map(function ($alert) {
            return [
                'id' => $alert->id,
                'type' => $alert->type,
                'message' => $alert->message,
                'studentId' => $alert->student ? $alert->student->id : null,
                'sessionId' => $alert->session ? $alert->session->id : null,
                'timestamp' => $alert->timestamp->toISOString(),
                'severity' => $alert->severity,
                'read' => $alert->read,
            ];
        });

        return response()->json($alerts);
    }

    public function markAsRead($id)
    {
        $alert = Alert::where('id', $id)->firstOrFail();
        $alert->update(['read' => true]);

        return response()->json([
            'id' => $alert->id,
            'type' => $alert->type,
            'message' => $alert->message,
            'studentId' => $alert->student ? $alert->student->id : null,
            'sessionId' => $alert->session ? $alert->session->id : null,
            'timestamp' => $alert->timestamp->toISOString(),
            'severity' => $alert->severity,
            'read' => $alert->read,
        ]);
    }
}
