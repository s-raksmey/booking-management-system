import { Button } from '@/components/ui/button';

interface ReportPaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  isLoading: boolean;
}

export function ReportPagination({ page, totalPages, setPage, isLoading }: ReportPaginationProps) {
  return (
    <div className="flex justify-between mt-4">
      <Button
        disabled={page === 1 || isLoading}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        disabled={page === totalPages || isLoading}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}