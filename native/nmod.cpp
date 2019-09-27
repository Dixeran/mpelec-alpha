#include <napi.h>
#include <Windows.h>
#include "include/client.h"

// life time with NodeJS main thread.(?)
mpv_handle *ctx = nullptr;

Napi::ArrayBuffer InitMpv(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 1)
    {
        Napi::TypeError::New(env, "Need arg:wid to init mpv.").ThrowAsJavaScriptException();
        return Napi::ArrayBuffer::New(env, 0);
    }
    int64_t wid = info[0].As<Napi::Number>().Int32Value();
    ctx = mpv_create();
    // mpv_set_property(ctx, "wid", MPV_FORMAT_INT64, &wid);
    // mpv_initialize(ctx);
    Napi::ArrayBuffer js_ctx = Napi::ArrayBuffer::New(env, &ctx, 8);
    return js_ctx;
}

Napi::Value Play(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 1)
    {
        Napi::TypeError::New(env, "Need arg:file to play.").ThrowAsJavaScriptException();
        return env.Null();
    }
    const char *cmd[] = {"loadfile", "test.mp4", NULL};
    mpv_command(ctx, cmd);
    return env.Null();
}

Napi::Value FuckFrameless(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    int64_t wid = info[0].As<Napi::Number>().Int32Value();
    HWND windowHandle = (HWND)wid;
    /*frameless window musn't have WS_THICKFRAME*/
    // LONG_PTR style = GetWindowLongPtr(windowHandle, GWL_STYLE);
    // style = style | WS_THICKFRAME;
    // SetWindowLongPtr(windowHandle, GWL_STYLE, style);

    // style = GetWindowLongPtr(windowHandle, GWL_EXSTYLE);
    // style = style | WS_EX_TRANSPARENT;
    // SetWindowLongPtr(windowHandle, GWL_EXSTYLE, style);

    HWND child = FindWindowEx(windowHandle, NULL, NULL, NULL);
    if (child != NULL)
    {
        wid = (int64_t)child;
        mpv_set_property(ctx, "wid", MPV_FORMAT_INT64, &wid);
        mpv_initialize(ctx);
        const char *cmd[] = {"loadfile", "test.mp4", NULL};
        mpv_command(ctx, cmd);
    }
    else
    {
        mpv_set_property(ctx, "wid", MPV_FORMAT_INT64, &wid);
        mpv_initialize(ctx);
        const char *cmd[] = {"loadfile", "test.mp4", NULL};
        mpv_command(ctx, cmd);
    }
    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, InitMpv));
    exports.Set(Napi::String::New(env, "play"), Napi::Function::New(env, Play));
    exports.Set(Napi::String::New(env, "fuck"), Napi::Function::New(env, FuckFrameless));
    return exports;
}

NODE_API_MODULE(addon, Init)