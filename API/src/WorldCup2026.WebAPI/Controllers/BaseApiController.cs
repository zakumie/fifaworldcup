using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.Common;

namespace WorldCup2026.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult HandleResult(Result result)
    {
        if (result.Succeeded) return Ok();
        return BadRequest(new { error = result.Error });
    }

    protected ActionResult HandleResult<T>(Result<T> result)
    {
        if (result.Succeeded) return Ok(result.Data);
        return BadRequest(new { error = result.Error });
    }
}
