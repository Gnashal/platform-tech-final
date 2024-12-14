import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.2";
import {
  IRequestBody,
  sendMail,
} from "https://deno.land/x/sendgrid@0.0.3/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const SEND_GRIND_API = Deno.env.get("SEND_GRID_KEY");

if (!SEND_GRIND_API) {
  throw new Error("SEND_GRID_KEY is not set in the environment.");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }
  const { student_name, course_name, email } = await req.json();

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

  if (!course_name) {
    return new Response(JSON.stringify({ error: "Missing Fields" }), {
      status: 405,
    });
  }
  try {
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_name", student_name)
      .single();
    console.log({ studentData, studentError });

    if (!studentData || studentError) {
      return new Response(
        JSON.stringify(studentError || { error: "Student not found" }),
      );
    }

    const studentID = studentData.student_id;

    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("course_name", course_name)
      .single();
    console.log({ courseData, courseError });

    if (!courseData || courseError) {
      return new Response(
        JSON.stringify(courseError || { error: "Course not found" }),
      );
    }
    const courseID = courseData.course_id;

    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .insert({
        student_id: studentID,
        course_id: courseID,
      });
    if (enrollmentError) {
      return new Response(JSON.stringify(enrollmentError));
    }
    const response = await sendMail(emailData, { apiKey: SEND_GRIND_API });
    if (!response.success) {
      throw new Response(JSON.stringify(response.errors));
    }
    const emailSuccessMsg = JSON.stringify({ message: "Email sent" });

    return new Response(
      JSON.stringify(
        JSON.stringify(
          emailSuccessMsg + `Welcome to the course ${course_name}`,
        ),
      ),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: "An unknown error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
