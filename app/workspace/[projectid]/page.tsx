"use client"

import { useParams } from 'next/navigation'
import React, { useEffect,useState,useCallback, useRef } from 'react'
import { DownloadCloud,Share2Icon } from 'lucide-react';

import {
  ReactFlow,
  addEdge,
  applyEdgeChanges, applyNodeChanges,Background 
} from '@xyflow/react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
 
import '@xyflow/react/dist/style.css';
import { Node,Edge } from "@xyflow/react"
import ContextMenu from '@/components/ContextMenu';
import { Menu,Position } from '@/types/types';
import html2pdf from "html2pdf.js"
import { getURL } from 'next/dist/shared/lib/utils';


export default function page() { 
  const [nodeData,setNodeData] = useState([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeID,setNodeID] = useState({});
  const [totalChildNodeCount,setTotalChildNodeCount] = useState<number>()
  const [menu, setMenu] = useState<Menu>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [shareInput,setShareInput] = useState("");
  const [canSharedUserMakeChanges,setCanSharedUserMakrChanges] = useState(false)
  const [checkCreatedNewNode,setCheckCreatedNewNode] = useState<boolean>(false);
  const [ parentNodePosition,setParentNodePosition] = useState<Position>({ x : 400 , y : 50 });
  const [ childNodePosition,setChildNodePosition] = useState<Position>({ x : 0 , y : 0 });
  const { projectid } = useParams()



  // on window load fetch all node of a project
  useEffect(() => {
    async function fetchallNodes(){
      try {

        const res = await fetch(`/api/getallNodes/${projectid}`)
        if(res.status != 200){
          console.log(res)
        }
        const data = await res.json()

        //checking if there is data (which is an array) in my data variable if not then i will creta a default one 
        if(data?.data?.length == 0){
          createDefaultNode()
        }

        setNodeData(data?.data) // set the node data here

        console.log(data)

      } catch (error) {
        console.log(error ?? "Error from Server side")
      }
    }
      fetchallNodes()
  },[checkCreatedNewNode])


  useEffect(() => {
    
    const initialNodes = nodeData.flatMap((nodefield : any) => [{
      id : `${nodefield?._id.toString()}`,
      position : {
        x : nodefield?.position?.x,
        y :  nodefield?.position?.y,
      },  
      data : {
        label : `${nodefield?.title}`
      }
    }])

    const initialEdges = nodeData.flatMap((nodefield : any) => {
      if(!nodefield?.parentNodeID) return []; //if no parent of a node then it mean it is root node
      return [{
        id : `e${nodefield?.parentNodeID}-${nodefield?._id}`,
        source : `${nodefield?.parentNodeID}`,
        target : `${nodefield?._id.toString()}`
      }]
    }) 

    setNodes(initialNodes)
    setEdges(initialEdges)

  },[nodeData,checkCreatedNewNode])

  // async function to create node
  async function createDefaultNode(){
    try {

      const res = await fetch(`/api/addnodes/${projectid}`,{
        method : "POST",
        headers : {
          "Content-Type":"application/json"
        },
        body : JSON.stringify({ title : "Default Node", position : { "x" : parentNodePosition.x , "y" : parentNodePosition.y } })
      })

      if(res.status != 201){
        console.log("Error While creatinig Node in DB")
      }

      const data = await res.json()

      console.log(data?.message)

    } catch (error) {
      console.log(error ?? "Internal Server error")
    }
  }


  // how i will creta a new node 
  // first i will select the node then i will press shift+N -> then the selected node id will be passed as a parent id and new node will be created
  // how the flow will look like 
  // select a node -> after selecting a node find its detail -> press shift+N -> after it pressed i will pass his id as parentnodeid and call the function

  async function createNewNode(parent_id : string | any) {
    try {

      // here i need to find the position of the node that is being created and set position of it 

      const nodePositon : Position = calculateChildNodePosition(parentNodePosition,totalChildNodeCount)

      const res = await fetch(`/api/addnodes/${projectid}`,{
        method : "POST",
        headers : {
          "Content-Type":"application/json"
        },
        body : JSON.stringify({ title : "New Node", position : { "x" : nodePositon.x , "y" : nodePositon.y },parentNodeID : parent_id })  
      })

      if(res.status != 201){
        console.log("Error While creatinig Node in DB")
      }

      const data = await res.json()

      console.log(data?.message)

      setCheckCreatedNewNode(!checkCreatedNewNode)

    } catch (error) {
      console.log(error ?? "Internal Server error")
    }
  }

  // program to delete the node when clicked once and delte button is pressed
  async function deleteNode(nodeid : any){
    try {

      const res = await fetch(`/api/deleteNode/${nodeid}`,{
        method : "DELETE"
      })
    
      if(res.status != 200){
        console.log(res)
      }
      const data = await res.json();
    
      console.log(data?.data?.message)
      
    } catch (error) {
      console.log(error ?? "Server Side Error")
    }
  }  

  async function toFindSingleNodeDetail(id :any){
    try {

      const res = await fetch(`/api/fetchSingleNode/${id}`)
      if(res.status != 200){
        console.log(res)
      } 

      const data = await res.json()

      setNodeID(data?.data?._id) // setting id to find the node detail and putting this id as a parent id for creating a new node.
      // setChildNodeCount(data?.data?.childNodeID)

      const totaChilddata : any = data?.data?.childNodeID
      // console.log(totaChilddata.length)
      setTotalChildNodeCount(totaChilddata.length) //setting total child node count to calculate the position of the node.


      // calulating position of the parent node 
      const calculateParentNodePositon : Position = data?.data?.position
      console.log(calculateParentNodePositon)

      setParentNodePosition(calculateParentNodePositon);
      

      
    } catch (error) {
      console.log(error ?? "Internal Server error")
    }
  }

  // function to select a node and find the detail of the node this method comes from the reactflow libraby
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    toFindSingleNodeDetail(node.id)
  }

  // function which will listen to keyboard events
  const handleKeyPress = (e: KeyboardEvent) => {
    if(e.shiftKey && e.key == "N" && selectedNode){
      createNewNode(nodeID);
    }
    if(e.key === "Backspace" || e.key === "Delete" && selectedNode){
      deleteNode(nodeID);
    }
  }


  // writng a progrmam to listen on keyboard events
 useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
  return () => {
     window.removeEventListener('keydown', handleKeyPress)
  }
 },[selectedNode])


const onNodeContextMenu = useCallback(
  (event :  React.MouseEvent, node: Node) => {
    // Prevent native context menu from showing
    event.preventDefault();

    // Calculate position of the context menu. We want to make sure it
    // doesn't get positioned off-screen.
    if(ref.current){
      const pane = ref.current.getBoundingClientRect();
      console.log("ref connected")
      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 200 && event.clientY,
        left: event.clientX < pane.width - 200 && event.clientX,
        right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
        bottom:
          event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    } else {
      console.log("errro in the ref field")
    }
  },
  [setMenu],
);


const onPaneClick = useCallback(() => setMenu(null), [setMenu]);


// function to download the file 
async function downloadInPdfFormat(){
  if (typeof window !== 'undefined') {
    const element = document.querySelector('.react-flow');
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 1,
      filename: 'mindmap.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  }
}

const convertToMarkdown = (nodes: Node[]) => {
  let markdown = `# ${nodes[0]?.data?.label || 'Mind Map'}\n\n`;

   const buildMarkdownTree = (nodeId: string, level: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if(!node) return;

    markdown += `${'  '.repeat(level)}* ${node.data.label}\n`;

    const childNodes = nodes.filter(n => n.data.parentNodeID === node.id);
    childNodes.forEach(child => buildMarkdownTree(child.id, level + 1));
   }

   buildMarkdownTree(nodes[0]?.id, 0);
   return markdown

}

const handleDownloadFormat = (format : 'pdf' | 'markdown') => {
  if(format === 'pdf'){
    downloadInPdfFormat()
  } else {
    const markdown = convertToMarkdown(nodes);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.md';
    a.click();
    URL.revokeObjectURL(url);
  }
}

// functions to share the files 
async function constructShareUrl(){
  const constructedUrl = `${window.location.origin}${getURL()}`
  console.log(constructedUrl)
  setShareInput(constructedUrl);
}







// function to calculate position 
// it will return the positon of the newly node created

 const Horizontal_Spacing : number = 100;
 const Vertical_Spacing : number = 70;

  const calculateChildNodePosition = (parentPosition : Position, totalChildren : number | any) => {
    // if parent Node don't have any child then the posiont of its first child

    if(totalChildren === 1){
        return {
            x : parentPosition.x,
            y : parentPosition.y + Vertical_Spacing
        }
    } 

      const startX = parentPosition.x - ((totalChildren - 1) * Horizontal_Spacing) / 2;

      return {
        x: startX + ((totalChildNodeCount+1) * Horizontal_Spacing),
        y: parentPosition.y + Vertical_Spacing
      };

  }







  //---------------------------------------------------------------------------------------------------------
  // these three method are for the connectivity of the node , like moving ,connecting from one to another and moving edges

  const onNodesChange = useCallback(
    (changes : any) => setNodes((nds : any) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes : any) => setEdges((eds : any) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (params : any) => setEdges((eds : any) => addEdge(params, eds)),
    [setEdges],
  );

  // <div className=' flex gap-2 items-center border cursor-pointer border-white shadow-md shadow-slate-300 p-1 rounded' onClick={handleDownloadClick}>
  //               <p className='text-xs px-2'>Download</p>
  //             </div>

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
        <div>
          {/* this div part is for download part  */}
          <div className='pt-3 px-6 flex justify-end gap-8 z-50'>
              <Select onValueChange={handleDownloadFormat}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue className='placeholder:text-xs' placeholder={<div className='flex gap-2 items-center'><DownloadCloud size={15} /><span className='text-xs'>as</span></div>}/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup >
                    <SelectItem value="pdf" className='text-xs cursor-pointer'>Pdf</SelectItem>
                    <SelectItem value="markdown" className='text-xs cursor-pointer'>Markdown</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* this part is for sharing the page  */}
              <div>
                  <Dialog>
                    <DialogTrigger asChild onClick={constructShareUrl}>
                      <Button variant="outline" className='px-3 py-1'>{<Share2Icon size={12} />}</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Share it...</DialogTitle>
                        <DialogDescription>
                          Give Permission to make changes.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Input
                            id="name"
                            className="col-span-3 text-xs"
                            value={shareInput}
                            onChange={(e) => setShareInput(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="terms" />
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            User can make changes (default *no*).
                          </label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={() =>  navigator.clipboard.writeText(shareInput)}
                        >Copy link</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </div>
          </div>
        </div>
       <ReactFlow
              ref={ref}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodeContextMenu={onNodeContextMenu}
              fitView
            >
     <Background />
      {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
    </ReactFlow>
   </div>
  )
}
