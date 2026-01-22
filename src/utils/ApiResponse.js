class ApiResponse{
    constructor( 
        statusCode, 
        message = "Sucess", // since it's an api Response, message would be success most of the times
        data = null
    ){ 
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; // the status codes < 400 means success i think?
    }
}

export { ApiResponse }