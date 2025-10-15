import { Loader2 } from "lucide-react";

interface DataLoadingProps {
  message?: string;
}

const DataLoading = ({ message = "Loading..." }: DataLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-slate-500 mb-2" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
};

export default DataLoading;
