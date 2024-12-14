import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.2";

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
  const { email, password } = await req.json();
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Missing Fields" }),
      {
        status: 405,
      },
    );
  }
  try {
    const { data: authData, error: logInError } = await supabase.auth
      .signInWithPassword({
        email: email,
        password: password,
      });
    if (logInError) {
      return new Response(JSON.stringify(logInError));
    }
    return new Response(`Welcome ${email}` + JSON.stringify(authData));
  } catch (e) {
    const errorMessage = e instanceof Error
      ? e.message
      : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});
