<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Welcome</title>
</head>
<body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #1f2937;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="margin-bottom:8px;">Welcome, {{ $name }}!</h2>
    <p style="color:#374151;margin-bottom:16px;">A student account has been created for you on the Attendance System. To set your password and activate your account, open the secure link below.</p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:8px;margin-bottom:16px;">
      <p style="margin:0;font-weight:600;">Set your password</p>
      <p style="margin:6px 0 0;">Email: <strong>{{ $email }}</strong></p>
      <p style="margin:12px 0 0;"><a href="{{ $resetUrl }}" style="display:inline-block;padding:8px 12px;background:#111827;color:#fff;border-radius:6px;text-decoration:none;">Set your password</a></p>
    </div>

    <p style="margin-bottom:16px;color:#374151;">If the button above does not work, copy and paste this link into your browser:</p>
    <p style="word-break:break-all;color:#1f2937;font-size:13px;margin-bottom:16px;">{{ $resetUrl }}</p>

    <p style="color:#6b7280;font-size:13px;margin-top:24px;">If you did not expect this email, contact your administrator.</p>
  </div>
</body>
</html>
