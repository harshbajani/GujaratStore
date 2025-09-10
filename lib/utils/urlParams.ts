interface FilterState {
  secondaryCategories: string[];
  colors: string[];
  priceRange: [number, number];
  priceRanges: string[];
}

interface UrlState {
  filters: FilterState;
  sortBy: string;
}

/**
 * Converts filter state to URL search parameters
 * @param filters - The filter state object
 * @param sortBy - The current sort method
 * @returns URLSearchParams object
 */
export function filtersToUrlParams(filters: FilterState, sortBy: string): URLSearchParams {
  const params = new URLSearchParams();

  // Add sorting
  if (sortBy && sortBy !== 'featured') {
    params.set('sort', sortBy);
  }

  // Add secondary categories
  if (filters.secondaryCategories.length > 0) {
    params.set('categories', filters.secondaryCategories.join(','));
  }

  // Add colors
  if (filters.colors.length > 0) {
    params.set('colors', filters.colors.join(','));
  }

  // Add price ranges
  if (filters.priceRanges.length > 0) {
    params.set('priceRanges', filters.priceRanges.join(','));
  }

  // Add price range slider (only if different from default)
  if (filters.priceRange[0] > 0 || filters.priceRange[1] > 0) {
    params.set('minPrice', filters.priceRange[0].toString());
    params.set('maxPrice', filters.priceRange[1].toString());
  }

  return params;
}

/**
 * Converts URL search parameters to filter state
 * @param searchParams - URLSearchParams or search string
 * @param defaultPriceRange - Default price range for the category
 * @returns Filter state and sort method
 */
export function urlParamsToFilters(
  searchParams: URLSearchParams | string,
  defaultPriceRange: [number, number] = [0, 0]
): UrlState {
  const params = typeof searchParams === 'string' 
    ? new URLSearchParams(searchParams) 
    : searchParams;

  const filters: FilterState = {
    secondaryCategories: params.get('categories')?.split(',').filter(Boolean) || [],
    colors: params.get('colors')?.split(',').filter(Boolean) || [],
    priceRanges: params.get('priceRanges')?.split(',').filter(Boolean) || [],
    priceRange: [
      parseInt(params.get('minPrice') || '0') || defaultPriceRange[0],
      parseInt(params.get('maxPrice') || '0') || defaultPriceRange[1]
    ]
  };

  const sortBy = params.get('sort') || 'featured';

  return { filters, sortBy };
}

/**
 * Updates the current URL with new filter parameters without page reload
 * @param filters - The filter state
 * @param sortBy - The sort method
 * @param pathname - Current pathname
 */
export function updateUrlWithFilters(
  filters: FilterState,
  sortBy: string,
  pathname: string
): void {
  const params = filtersToUrlParams(filters, sortBy);
  const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  
  // Use replaceState to update URL without adding to history
  window.history.replaceState({}, '', newUrl);
}

/**
 * Checks if any filters are active
 * @param filters - The filter state
 * @param sortBy - The sort method
 * @returns boolean indicating if any non-default filters are active
 */
export function hasActiveFilters(filters: FilterState, sortBy: string): boolean {
  return (
    filters.secondaryCategories.length > 0 ||
    filters.colors.length > 0 ||
    filters.priceRanges.length > 0 ||
    sortBy !== 'featured' ||
    (filters.priceRange[0] > 0 || filters.priceRange[1] > 0)
  );
}

/**
 * Generates a shareable URL for the current filters
 * @param filters - The filter state
 * @param sortBy - The sort method
 * @param baseUrl - The base URL (e.g., window.location.origin + pathname)
 * @returns Complete shareable URL
 */
export function generateShareableUrl(
  filters: FilterState,
  sortBy: string,
  baseUrl: string
): string {
  const params = filtersToUrlParams(filters, sortBy);
  return `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
}
