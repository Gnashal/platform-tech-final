import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  IRequestBody,
  sendMail,
} from "https://deno.land/x/sendgrid@0.0.3/mod.ts";

const SEND_GRIND_API = Deno.env.get("SEND_GRID_KEY");

if (!SEND_GRIND_API) {
  throw new Error("SEND_GRID_KEY is not set in the environment.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ message: "Send-email function is working" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { student_name, course_name, email } = await req.json();

  if (!email) {
    return new Response(
      JSON.stringify({ error: "No email provided / Missing email" }),
      { status: 400 },
    );
  }

  const emailData: IRequestBody = {
    personalizations: [
      {
        to: [{ email }],
        subject: `Welcome to ${course_name}!`,
        substitutions: {
          "{{student_name}}": student_name,
          "{{course_name}}": course_name,
        },
      },
    ],
    from: { email: "yousifceballos@gmail.com" },
    content: [
      {
        type: "text/html",
        value: `
          <h1>Welcome, ${student_name}!</h1>
          <p>We are thrilled to have you join <strong>${course_name}</strong>.</p>
          <p>Feel free to reach out if you have any questions or need assistance.</p>
          <br>
          <p>Best regards,</p>
          <p>The Course Team</p>
        `,
      },
    ],
  };

  try {
    const response = await sendMail(emailData, { apiKey: SEND_GRIND_API });
    return new Response(JSON.stringify({ message: "Email sent" }), {
      status: response.success ? 200 : 500,
    });
  } catch (e) {
    const errorMessage = e instanceof Error
      ? e.message
      : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});
