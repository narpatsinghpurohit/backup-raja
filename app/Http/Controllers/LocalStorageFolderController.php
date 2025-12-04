<?php

namespace App\Http\Controllers;

use App\Services\LocalStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocalStorageFolderController extends Controller
{
    public function __construct(
        private LocalStorageService $storageService
    ) {}

    /**
     * List folders in a directory
     * GET /api/local-storage/folders?disk=local&path=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'disk' => 'required|string|in:local,public',
            'path' => 'nullable|string|max:500',
        ]);

        $disk = $request->query('disk', 'local');
        $path = $request->query('path', '');

        try {
            $folders = $this->storageService->listFolders($disk, $path);
            return response()->json(['folders' => $folders]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new folder
     * POST /api/local-storage/folders
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'disk' => 'required|string|in:local,public',
            'path' => 'nullable|string|max:500',
            'name' => 'required|string|max:255',
        ]);

        $disk = $request->input('disk', 'local');
        $parentPath = $request->input('path') ?? '';
        $name = $request->input('name');

        try {
            $folder = $this->storageService->createFolder($disk, $parentPath, $name);
            return response()->json(['folder' => $folder], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
