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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  const { email } = await req.json();

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
        subject: "Welcome Email",
      },
    ],
    from: { email: "yousifceballos@gmail.com" },
    content: [
      {
        type: "text/plain",
        value: "Welcome! Please to have you.",
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
