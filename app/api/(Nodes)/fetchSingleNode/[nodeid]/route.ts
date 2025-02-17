import { connectDb } from "@/connections/connectDb";
import { NextResponse } from "next/server";
import { nodeModel } from "@/model/nodes";

export async function GET(req: Request) {
    try {

        await connectDb()

        const url = new URL(req.url);
        const nodeid = url.pathname.split('/').pop();

        if(!nodeid){
            return NextResponse.json(
                {message : "Invalid Node id"},
                {status : 404}
            )
        }
        
        const node = await nodeModel.findById(nodeid)

        if(!node){
            return NextResponse.json(
                {message : "Error in fetching node form DB"},
                {status : 404}
            )
        }

        return NextResponse.json(
            {message : "Node founded",data : node},
            {status : 200}
        )

    } catch (error) {
        return NextResponse.json(
            {message : error ?? "internal serber issue"},
            {status : 500}
        )
    }
}