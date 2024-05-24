import clientPromise from "@/mongodb";

export async function GET(request) {

    try {
        const client = await clientPromise;
        const db = client.db("amplify");
        const movies = await db
            .collection("cohorts")
            .find({})
            .toArray();
        // res.json(movies);
        
        return Response.json(
            { formSubmissionsId: movies },
            { status: 200 }
          );

    } catch (e) {
        console.error(e);
    }

    return Response.json(
            { formSubmissionsId: "unreached" },
            { status: 200 }
          );
  }