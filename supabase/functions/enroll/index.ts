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
  const { student_name, course_name } = await req.json();

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
    return new Response(
      JSON.stringify(
        JSON.stringify({ message: `Welcome to the course ${course_name}` }),
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
