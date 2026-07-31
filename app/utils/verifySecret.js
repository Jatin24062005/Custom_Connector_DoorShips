export function verifySecret(request) {

    const secret =
        request.headers.get("x-doorships-secret");

    if (
        secret !== process.env.DOORSHIPS_SECRET
    ) {

        throw new Response("Unauthorized", {
            status: 401
        });

    }

}