import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  const { email, password, role } = await req.json();

  if (!email || !password || !role) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  // Validate role
  const validRoles = ["admin", "instructor", "student"];
  if (!validRoles.includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), {
      status: 400,
    });
  }

  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !data) {
      throw authError;
    }

    const { data: updatedData, error: updateError } = await supabase.auth
      .updateUser({
        data: { role },
      });

    if (updateError) {
      throw updateError;
    }

    if (updatedData) {
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          user_auth_id: updatedData.user.id,
          role: updatedData.user.user_metadata?.role,
          email: updatedData.user.email,
        });

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        message: "User created and role assigned",
        user: updatedData,
      }),
      { status: 200 },
    );
  } catch (e) {
    const errorMessage = e instanceof Error
      ? e.message
      : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});
