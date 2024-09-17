import { React, useState, useMemo} from 'react'
import {
    Grid3x3, Database, Workflow, ArrowRight, Cog, Target, Scale,
    Layers, FileSpreadsheet, Folder, Wand2, LayoutGrid, Users, UserCheck,
    Lock, UsersRound, ClipboardList, Megaphone, Diamond, GitBranch,
    Box, GitMerge, ShoppingBag, Wand, Flag, ShieldCheck, LayoutDashboard,
    UserPlus, ScrollText, Gem, Mail, ChevronLeft, ChevronDown, ChevronRight
} from 'lucide-react'
import '../css/global.css'
import docsStructure from '../../versioned_sidebars/version-2.50.0-LTS-sidebars.json'

const generateMenuItems = (items) => {
    return items.map(item => {
      if (item.type === 'category') {
        return {
          title: item.label,
          subItems: item.items ? generateMenuItems(item.items) : []
        };
      } else if (item.type === 'doc' || typeof item === 'string') {
        return {
          title: typeof item === 'string' ? item.split('/').pop() : item.id.split('/').pop()
        };
      }
      // Handle other types if necessary
      return null;
    }).filter(Boolean); // Remove any null items
  };

const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 h-12">
        <div className="flex items-center">
            <img src="/tooljet-logo.svg" alt="ToolJet Logo" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-semibold text-gray-800">DOCS</span>
        </div>
    </header>
)

// UI Components
const Card = ({ className = '', children }) => (
    <div className={`relative rounded-lg bg-transparent group ${className}`}>
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-50" 
             style={{
                 background: 'linear-gradient(to bottom, #3B82F6, transparent) border-box',
                 border: '0px',
                 backgroundClip: 'padding-box, border-box',
                 backgroundOrigin: 'border-box',
                 pointerEvents: 'none'
             }}>
        </div>
        <div className="m-0.5 relative z-10 h-full rounded-lg border border-gray-300 bg-white">
            {children}
        </div>
    </div>
);

const CardHeader = ({ className = '', children }) => (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
        {children}
    </div>
);

const CardContent = ({ className = '', children }) => (
    <div className={` pt-2 ${className}`}>
        {children}
    </div>
);

const CardTitle = ({ className = '', children }) => (
    <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>
        {children}
    </h3>
);

const Button = ({ variant = "default", className = '', children }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variantStyles = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary"
    };

    return (
        <button className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
            {children}
        </button>
    );
}

const Sidebar = ({ isOpen, toggleSidebar, menuItems }) => (
    <aside className={`bg-white h-[calc(100vh-64px)] fixed left-0 top-16 flex flex-col overflow-hidden border-r border-gray-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-6'}`}>
        <div className="flex-1 overflow-y-auto">
            {isOpen && (
                <nav className="p-4">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                {item.subItems ? (
                                    <details>
                                        <summary className="cursor-pointer px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-150 ease-in-out">
                                            {item.title}
                                        </summary>
                                        <ul className="pl-4">
                                            {item.subItems.map((subItem, subIndex) => (
                                                <li key={subIndex}>
                                                    <a 
                                                        href="#" 
                                                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-150 ease-in-out"
                                                    >
                                                        {subItem.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                ) : (
                                    <a 
                                        href="#" 
                                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-150 ease-in-out"
                                    >
                                        {item.title}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
        <button 
            onClick={toggleSidebar} 
            className="p-2 w-full text-gray-500 hover:bg-gray-100 transition-colors duration-150 ease-in-out flex justify-center items-center"
        >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
    </aside>
);


const Homepage = () => {

    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const menuItems = useMemo(() => generateMenuItems(docsStructure.docs), []);


    return (
        <main className="flex flex-col" >
            <Header />
            <div className="flex flex-1 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} menuItems={menuItems} />
                <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-6'}`}>
                    <div className="relative w-full p-10 pt-20 pb-14 space-y-12 bg-gradient-to-br from-blue-50 to-pink-50 overflow-hidden">
                        {/* Grid pattern */}
                        <div
                            className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
                            style={{
                                backgroundImage: `
                linear-gradient(to left, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                                backgroundSize: '64px 64px',
                                maskImage: 'linear-gradient(to left, rgba(0, 0, 0, 1.0) 20%, transparent 80%)',
                                WebkitMaskImage: 'linear-gradient(to left, rgba(0, 0, 0, 1.0) 20%, transparent 80%)'
                            }}
                        ></div>

                        {/* ToolJet Documentation Section */}
                        <div className="space-y-6 relative">
                            <h1 className="text-4xl font-bold">
                                ToolJet <span className="text-blue-600">Documentation</span>
                            </h1>
                            <p className="text-xl text-gray-600">
                                Learn how to get up and running with ToolJet
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { icon: Grid3x3, title: "App Builder", color: "text-green-500", content: "Design and create applications effortlessly with ToolJet's intuitive app builder, featuring a drag-and-drop interface and powerful pre-built components to streamline development." },
                                    { icon: Database, title: "ToolJet Database", color: "text-red-500", content: "Powered by PostgreSQL, offering a user-friendly UI editor. This allows you to manage, edit, and interact with your data directly within the platform." },
                                    { icon: Workflow, title: "Workflows", color: "text-purple-500", content: "Automate processes and define workflows with precision, empowering your apps to handle tasks intelligently." }
                                ].map((item, index) => (
                                    <Card key={index} className="transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer group relative">
                                        <div className="p-8">
                                            <CardHeader>
                                                <div className="w-12 h-12 mb-5 rounded-lg bg-white shadow-md flex items-center justify-center transition-all duration-300 ease-in-out group-hover:shadow-lg">
                                                    <item.icon className={`w-6 h-6 ${item.color}`} />
                                                </div>
                                                <CardTitle>{item.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-500">
                                                    {item.content}
                                                </p>
                                            </CardContent>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            <Card className="bg-white">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <Card className="bg-gray-50 p-4">
                                                <p className="text-2xl font-bold">.48</p>
                                                <p className="text-sm text-gray-500">Customers</p>
                                                <p className="text-sm text-green-500">↑20%</p>
                                            </Card>
                                            <Card className="bg-gray-50 p-4">
                                                <p className="text-2xl font-bold">307.48</p>
                                                <p className="text-sm text-gray-500">Total Customers</p>
                                                <p className="text-sm text-red-500">↓30%</p>
                                            </Card>
                                            <Card className="p-4">
                                                <p className="text-sm font-bold">307.48</p>
                                                <p className="text-sm text-gray-500">Total Customers</p>
                                                <p className="text-sm text-green-500">↑30%</p>
                                            </Card>
                                            <Card className="bg-gray-50 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-2xl font-bold">34.48k</p>
                                                        <p className="text-sm text-gray-500">Total Customers</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <img src="/placeholder.svg?height=20&width=30" alt="Australia flag" className="w-6 h-4" />
                                                        <p className="text-sm text-gray-500">Australia</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
                                            <p className="text-sm text-gray-500">
                                                Discover how to create and publish apps within minutes
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                
                <div className="w-full p-10 space-y-12 bg-white">
                    {/* Setup ToolJet Section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Setup ToolJet</h2>
                        <p className="text-sm text-gray-500">
                            Check out the different methods you can use to deploy ToolJet on your machine
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Cog, title: "Try ToolJet" },
                                { icon: Cog, title: "System requirement" },
                                { icon: Target, title: "Choose your ToolJet" },
                                { icon: Scale, title: "Upgrade to LTS" }
                            ].map((item, index) => (
                                <Card key={index} className="transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer group relative">
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-200 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative bg-white rounded-lg p-0.5">
                                        <div className="bg-white rounded-lg">
                                            <CardHeader>
                                                <div className="w-12 h-12 rounded-lg bg-white shadow-md flex items-center justify-center transition-all duration-300 ease-in-out group-hover:shadow-lg">
                                                    <item.icon className="w-6 h-6 text-blue-500" />
                                                </div>
                                                <CardTitle className="text-sm">{item.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-gray-500">
                                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus purus orci, dictum ut tellus ac, facilisis congue tellus.
                                                </p>
                                            </CardContent>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Deploy on Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold">Deploy on</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                "DigitalOcean", "Docker", "AWS EC2", "AWS ECS",
                                "Openshift", "Helm", "Kubernetes", "Kubernetes (GKE)",
                                "Kubernetes (GKE)", "Kubernetes (AKS)", "Kubernetes (AKS)", "Kubernetes (EKS)"
                            ].map((item, index) => (
                                <Card key={index} className="bg-white p-4 flex items-center justify-center">
                                    <span className="text-sm font-medium">{item}</span>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Explore more details link */}
                    <div className="text-center">
                        <Button variant="link" className="text-blue-600 hover:text-blue-800">
                            Explore more details <ArrowRight className="ml-2 w-4 h-4 inline" />
                        </Button>
                    </div>

                    {/* Bring your data to ToolJet section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Bring your data to ToolJet</h2>
                        <p className="text-sm text-gray-500">
                            Check out the different methods you can use to deploy ToolJet on your machine
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Layers, title: "Overview" },
                                { icon: FileSpreadsheet, title: "Sample data source" },
                                { icon: Folder, title: "Datasource library" },
                                { icon: Wand2, title: "Transformation" }
                            ].map((item, index) => (
                                <Card key={index} className="transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer group relative">
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-green-200 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative bg-white rounded-lg p-0.5">
                                        <div className="bg-white rounded-lg">
                                            <CardHeader>
                                                <div className="w-12 h-12 rounded-lg bg-white shadow-md flex items-center justify-center transition-all duration-300 ease-in-out group-hover:shadow-lg">
                                                    <item.icon className="w-6 h-6 text-green-500" />
                                                </div>
                                                <CardTitle className="text-sm">{item.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-gray-500">
                                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus purus orci, dictum ut tellus ac, facilisis congue tellus.
                                                </p>
                                            </CardContent>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Manage your organization section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Manage your organization</h2>
                        <p className="text-sm text-gray-500">
                            Check out the different methods you can use to deploy ToolJet on your machine
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: LayoutDashboard, title: "Dashboard" },
                                { icon: Users, title: "Workspaces" },
                                { icon: UserCheck, title: "User authentication" },
                                { icon: Lock, title: "Permissions" },
                                { icon: UserPlus, title: "Users and groups" },
                                { icon: ScrollText, title: "Audit logs" },
                                { icon: Megaphone, title: "White label" },
                                { icon: Gem, title: "Super admin" },
                                { icon: Mail, title: "Licensing" }
                            ].map((item, index) => (
                                <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                                    <div className="w-10 h-10 rounded-lg bg-white shadow flex items-center justify-center">
                                        <item.icon className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <span className="text-sm font-medium">{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manage releases section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Manage releases</h2>
                        <p className="text-sm text-gray-500">
                            Check out the different methods you can use to deploy ToolJet on your machine
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { icon: GitBranch, title: "Git Sync" },
                                { icon: Box, title: "Multi-Environment" },
                                { icon: GitMerge, title: "Versioning and release" }
                            ].map((item, index) => (
                                <Card key={index} className="bg-white transition-all duration-150 ease-in-out hover:shadow-lg hover:border-blue-500 cursor-pointer">
                                    <CardHeader>
                                        <item.icon className="w-8 h-8 text-blue-500" />
                                        <CardTitle className="text-sm">{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-gray-500">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus purus orci, dictum ut tellus ac, facilisis congue tellus.
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Additional resources section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Additional resources</h2>
                        <p className="text-sm text-gray-500">
                            Check out the different methods you can use to deploy ToolJet on your machine
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: ShoppingBag, title: "Marketplace" },
                                { icon: Wand, title: "Copilot" },
                                { icon: Flag, title: "Tracking" },
                                { icon: ShieldCheck, title: "Security" }
                            ].map((item, index) => (
                                <Card key={index} className="bg-white transition-all duration-150 ease-in-out hover:shadow-lg hover:border-blue-500 cursor-pointer">
                                    <CardHeader>
                                        <item.icon className="w-8 h-8 text-green-500" />
                                        <CardTitle className="text-sm">{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-gray-500">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus purus orci, dictum ut tellus ac, facilisis congue tellus.
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </main>
    )
}

export default Homepage;