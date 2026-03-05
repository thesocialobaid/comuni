/*
This is the central error handler and allows us to handle the errors in the application 
Express has a special 4 argument middleware signature (err, req,res, next)
that it treats as an error handler. We put this at the very bottom of 
app.js (after all the routes) so that it catches any error that a controller 
passes via next(err)

BENEFITS: 
1. one place to format all error responses consistently 
2. Controllers stay clean - they just throw or call next(arr)
3. easy to add logging (e.g. Santry) later in one spot
*/

function errorHandler(err, req, res, next) {
    if (process.env.NODE_ENV === 'production') {
        console.error('Error: ', err);
    } else { 
        console.error('Error: ', err.message);
    }

    // Checking for MYSQL duplicate entry (e.g. duplicate email / roll number)
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
            sucess: false,
            message: 'A record with this value already exists', 
            detail: err.sqlMessage
         });
        } 

        // JWT errors (shouldn't reach here if auth middleware is used, but just in case)
    if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  // Validation errors we throw manually with a statusCode property
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
}

module.exports = errorHandler;

