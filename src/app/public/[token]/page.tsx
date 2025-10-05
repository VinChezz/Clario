import ShareEditor from "@/app/(routes)/workspace/_components/ShareEditor";
import { notFound } from "next/navigation";
import { 
  Card, 
  CardHeader, 
  CardContent 
} from "@/components/ui/card";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Shield, 
  Eye, 
  Edit 
} from "lucide-react";

export default async function PublicFilePage({
    params
} : { params: Promise<{ token: string }>}) {
    const {token} = await params

    const fileRes = await fetch(`${process.env.PUBLIC_URL}/api/share/${token}`)

    if (!fileRes.ok) {
        notFound()
    }

    const fileData = await fileRes.json()

    console.log('File data:', fileData);
    console.log('CreatedBy:', fileData.createdBy);

    const getInitials = (name: string) => {
        return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="max-w-6xl mx-auto h-[95vh] flex flex-col shadow-lg">
                <CardHeader className="pb-4 border-b bg-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <Shield className="h-8 w-8 text-blue-600"/>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {fileData.fileName}
                                    </h1>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <div className="flex items-center space-x-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={fileData.createdBy?.image} />
                                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                                    {fileData.createdBy?.name ? getInitials(fileData.createdBy.name) : 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-gray-600">
                                            Shared by {fileData?.name || fileData.team?.name || 'Unknown User'}
                                            </span>
                                        </div>

                                        <Badge 
                                        variant={fileData.permissions === "VIEW" ? "secondary" : "default"}
                                        className="flex items-center space-x-1"
                                        >
                                            {fileData.permissions === "VIEW" ? (
                                                <>
                                                    <Eye className="h-3 w-3"/>
                                                    <span>View only</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Edit className="h-3 w-3"/>
                                                    Can edit
                                                </>
                                            )}
                                        </Badge>

                                        <Badge 
                                        variant={"outline"} 
                                        className="bg-green-50 text-green-700 border-green-200"
                                        >
                                            Public link
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {fileData.version && (
                            <Badge variant={"outline"} className="text-xs">
                                v{fileData.version}
                            </Badge>
                        )}
                    </div>
                </CardHeader>


                <CardContent className="flex-1 p-0 bg-white rounded-lg overflow-hidden">
                    <ShareEditor 
                        fileId={fileData.id}
                        fileData={fileData}
                        onSaveTrigger={0}
                        isPublicAccess={true}
                        permissions={fileData.permissions}
                    />
                </CardContent>
            </Card>

            <div className="max-w-6xl mx-auto mt-4 text-center">
                <p className="text-sm text-gray-500">
                    This document is shared via secure link • {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
    )
}
