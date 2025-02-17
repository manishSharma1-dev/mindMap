import { connectDb } from "@/connections/connectDb"
import { NextResponse } from "next/server"
import { nodeModel } from "@/model/nodes"

export async function PUT(req:Request) {
    try {

        await connectDb();
        
        const url = new URL(req.url);
        const nodeid = url.pathname.split('/').pop();

        const { new_X, new_Y }  = await req.json()

        const movedPosition = await nodeModel.findByIdAndUpdate(
            nodeid,
            {
                $set : {
                    'position.x' : new_X,
                    'position.y' : new_Y
                }
            }, {
                new: true,
                runValidators: true,
            }
        )

        if (!movedPosition) {
           return NextResponse.json(
            {message : "Node not found"},
            {status : 400}
           )
        }


        await movedPosition.save({ validateBeforeSave : true })

        return NextResponse.json(
            {message : "Node Position Updated", data : movedPosition},
            {status : 200}
        )

        
    } catch (error) {
        return NextResponse.json(
            {message : error ?? "Internal server error"},
            {status : 500}
        )
    }
}