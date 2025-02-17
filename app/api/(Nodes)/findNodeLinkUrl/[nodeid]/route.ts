import { connectDb } from "@/connections/connectDb";
import { NextResponse } from "next/server";
import { nodeModel } from "@/model/nodes";

export async function GET(req:Request) {
    try {

        await connectDb()

        const url = new URL(req.url);
        const nodeid = url.pathname.split('/').pop();

        const findLink = await nodeModel.findById(nodeid)

        if(!findLink?.link){
            return NextResponse.json(
                {message : "No link is there..."}, 
                {status : 300}
            )
        }

        return NextResponse.json(
            {message : "Url found",data : findLink?.link},
            {status : 200}
        )

    } catch (error) {
        return NextResponse.json(
            {message : error ?? "Internal server error"},
            {status : 500}
        )
    }
}