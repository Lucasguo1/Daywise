import type { ApiTaskResponseItem } from "./types";

const API_BASE_URL = "http://hk.gyouths.cn/Lucas.php";

// Define a generic API response type for the helper
type ApiResponse<T> = 
  | { success: true; data: T } 
  | { success: false; error: string; status?: number };

/**
 * Helper function to make API requests.
 * Handles common logic like setting method, headers, body, and basic error checking.
 * @param method HTTP method ('GET' or 'POST')
 * @param params Parameters for the request. For GET, these are URL query params. For POST, this is the JSON body.
 * @returns Promise<ApiResponse<T>> where T is the expected data type on success.
 */
async function makeApiRequest<T>(
  method: "GET" | "POST",
  params: Record<string, any>
): Promise<ApiResponse<T>> {
  let url = API_BASE_URL;
  const requestOptions: RequestInit = {
    method: method,
  };

  if (method === "GET") {
    const query = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined) {
        query.append(key, params[key].toString());
      }
    }
    if (query.toString()) {
      url = `${API_BASE_URL}?${query.toString()}`;
    }
  } else { // POST
    requestOptions.headers = { "Content-Type": "application/json" };
    requestOptions.body = JSON.stringify(params);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed (${method} ${url}):`, response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        const message = errorJson.message || errorJson.error || `API Error: ${response.status}`;
        return { success: false, error: message, status: response.status };
      } catch (e) {
        return { success: false, error: `API Error: ${response.status} ${errorText}`, status: response.status };
      }
    }

    if (response.status === 204) {
      return { success: true, data: {} as T }; // Or null, depending on how you want to treat it
    }
    
    const responseData = await response.json();
    return { success: true, data: responseData as T };

  } catch (error) {
    console.error(`Network or other error during API request (${method} ${url}):`, error);
    if (error instanceof Error) {
      return { success: false, error: `Network error: ${error.message}` };
    }
    return { success: false, error: "An unknown network error occurred." };
  }
}

// --- Existing API functions refactored to use makeApiRequest ---

// Define a more specific type for the expected data in submitTaskToApi success response
interface SubmitSuccessData extends Partial<ApiTaskResponseItem> {
  status?: string; // e.g., "success"
  msg?: string;    // e.g., "data insert success"
  error?: string;  // To catch cases where API returns 200 OK but with an error message in JSON
}

export async function submitTaskToApi(
  taskData: { name: string; description?: string; dueDate?: string; priority?: string; estimatedCompletionTime?: number; },
  deviceId: string
): Promise<{ success: boolean; task?: ApiTaskResponseItem; error?: string; message?: string }> { // Added message to return type
  const params = {
    option: "insert", // Changed from "create" to "insert" as per your API response
    ...taskData,
    device: deviceId,
  };
  
  const result = await makeApiRequest<SubmitSuccessData>("POST", params);

  if (result.success) {
    const responseData = result.data;
    if (responseData && responseData.error) { // Check for explicit error in response body first
        console.error("API error payload (submitTaskToApi):", responseData.error);
        return { success: false, error: responseData.error };
    } else if (responseData && responseData.id) { // Ideal: API returns the created task object
        return { success: true, task: responseData as ApiTaskResponseItem };
    } else if (responseData && responseData.status === "success" && typeof responseData.msg === 'string') { // Your format
        console.log("API success message (submitTaskToApi):", responseData.msg);
        return { success: true, task: undefined, message: responseData.msg };
    } else { // Fallback for other unexpected 2xx response formats
        console.warn("submitTaskToApi received unexpected successful data format:", responseData);
        return { success: false, error: "Unexpected data format from API on task submission." };
    }
  } else {
    return { success: false, error: result.error };
  }
}

// For fetchTasksFromApi, assuming the API returns an object like { status: "success", data: [...] }
// or directly an array of tasks for a generic query.
interface FetchTasksSuccessData {
  status?: string;
  data?: ApiTaskResponseItem[]; 
  error?: string; 
  message?: string; // For messages like "No tasks found"
}

export async function fetchTasksFromApi(deviceId?: string): Promise<{ tasks?: ApiTaskResponseItem[]; error?: string }> {
  let method: "POST" | "GET"; // GET is not currently used by this logic but kept for type safety
  let params: Record<string, any>;

  // Based on your screenshot, it seems like you always want to query for all tasks
  // and the filtering (by device, etc.) is done client-side or not at all for this view.
  // If deviceId was meant for filtering, the API call would need to support it.
  // For now, matching the previous behavior of option: "all".
  method = "POST"; 
  params = {
    option: "all" // As per your previous working version's log
    // If deviceId is relevant for fetching, it should be added here:
    // ...(deviceId && { device: deviceId }) 
  };

  // If the API returns an object with a 'data' array: { status: "success", data: [...] }
  // then T for makeApiRequest is FetchTasksSuccessData
  // If the API might return the array directly: ApiTaskResponseItem[]
  // We need to handle both possibilities or be sure of the exact structure.
  // Let's assume it can be either for robustness, but prioritize the { data: [] } structure.
  const result = await makeApiRequest<FetchTasksSuccessData | ApiTaskResponseItem[]>(method, params);

  if (result.success) {
    const responseData = result.data;
    // 1. Check for { status: "success", data: [...] } structure
    if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray((responseData as FetchTasksSuccessData).data)) {
      return { tasks: (responseData as FetchTasksSuccessData).data };
    }
    // 2. Check if responseData is directly an array of tasks (less likely given your screenshot but possible for other endpoints)
    else if (Array.isArray(responseData)) {
      return { tasks: responseData as ApiTaskResponseItem[] };
    }
    // 3. Handle cases with an error message in a 2xx response
    else if (responseData && typeof responseData === 'object' && (responseData as FetchTasksSuccessData).error) {
      console.error("API returned 2xx but with error (fetchTasksFromApi):", (responseData as FetchTasksSuccessData).error);
      return { error: (responseData as FetchTasksSuccessData).error };
    }
    // 4. Handle "no tasks found" or similar messages if they come with a specific structure
    else if (responseData && typeof responseData === 'object' && (responseData as FetchTasksSuccessData).message && 
             (!(responseData as FetchTasksSuccessData).data || ((responseData as FetchTasksSuccessData).data?.length === 0))) { 
      console.log("API message (fetchTasksFromApi):", (responseData as FetchTasksSuccessData).message);
      return { tasks: [] }; 
    } 
    // 5. Fallback for other unexpected successful data formats
    else {
      console.error("API response for fetch tasks was not in the expected format:", responseData);
      return { error: "Invalid data format received from API for fetch tasks." };
    }
  } else {
    return { error: result.error };
  }
}

interface DeleteSuccessData { 
  status?: string; // e.g. "success"
  message?: string; // e.g. "delete success"
  error?: string;
}

export async function deleteTaskFromApi(taskId: string, deviceId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const params = {
    option: "delete",
    id: taskId, // Assuming API expects 'id' for delete based on your screenshot
    // device: deviceId, // Include if API requires deviceId for deletion authorization
  };

  const result = await makeApiRequest<DeleteSuccessData>("POST", params);

  if (result.success) {
    const responseData = result.data;
    if (responseData && responseData.error) {
      return { success: false, error: responseData.error };
    }
    // Check for specific success status/message if API provides them
    if (responseData && responseData.status === "success" && typeof responseData.message === 'string'){
        return { success: true, message: responseData.message };
    }
    // Generic success if no specific message but no error
    return { success: true, message: responseData.message || "Task deleted successfully." };
  } else {
    return { success: false, error: result.error };
  }
}

interface UpdateTaskSuccessData {
  status?: string; 
  message?: string; 
  task?: ApiTaskResponseItem; // If API returns updated task
  error?: string;
}

export async function updateTaskStatusInApi(
  taskId: string, 
  completed: boolean, 
  deviceId: string
): Promise<{ success: boolean; task?: ApiTaskResponseItem; error?: string; message?: string }> {
  const params = {
    option: "update",
    id: taskId, // Assuming API expects 'id'
    status: completed ? "Completed" : "Not Started", // Assuming API expects string status
    // device: deviceId, // Include if API requires deviceId for update authorization
  };

  const result = await makeApiRequest<UpdateTaskSuccessData>("POST", params);

  if (result.success) {
    const responseData = result.data;
    if (responseData && responseData.error) {
      return { success: false, error: responseData.error };
    }
    // Prioritize returning the task if available
    if (responseData && responseData.task) {
      return { success: true, task: responseData.task, message: responseData.message };
    }
    // Handle status/message success
    if (responseData && responseData.status === "success" && typeof responseData.message === 'string') {
        return { success: true, message: responseData.message };
    }
    // Generic success if structure is minimal but no error
    return { success: true, message: responseData.message }; 
  } else {
    return { success: false, error: result.error };
  }
}
