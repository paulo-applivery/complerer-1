export declare const api: {
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
    upload<T>(path: string, formData: FormData): Promise<T>;
};
//# sourceMappingURL=api.d.ts.map