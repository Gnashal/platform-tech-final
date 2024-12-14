import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }
  const { course_name } = await req.json();
  if (!course_name) {
    return new Response(JSON.stringify({ error: "Missing Fields" }), {
      status: 405,
    });
  }
  try {
    const { data: { user }, error: sessionError } = await supabase.auth
      .getUser();
    if (!user || sessionError) {
      return new Response(JSON.stringify(sessionError));
    }
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_name", user.user_metadata?.name)
      .single();

    if (!studentData || studentError) {
      return new Response(JSON.stringify(studentError));
    }

    const studentID = studentData.student_id;

    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("course_id")
      .eq("course_name", course_name)
      .single();
    if (!courseData || courseError) {
      return new Response(JSON.stringify(studentError));
    }
    const courseID = courseData.course_id;

    const { data, error: enrollmentError } = await supabase.from("enrollemnts")
      .insert({
        student_id: studentID,
        course_id: courseID,
      });
    if (enrollmentError) {
      return new Response(JSON.stringify(enrollmentError));
    }
    return new Response(
      JSON.stringify(data),
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
