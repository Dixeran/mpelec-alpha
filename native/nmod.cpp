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
    mpv_set_property(ctx, "wid", MPV_FORMAT_INT64, &wid);
    mpv_set_option_string(ctx, "config-dir", "./mpv_config");
    mpv_set_option_string(ctx, "config", "yes");
    mpv_initialize(ctx);
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
    // get path
    std::string path = info[0].As<Napi::String>().Utf8Value();
    const char *cmd[] = {"loadfile", path.c_str(), NULL};
    mpv_command(ctx, cmd);
    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, InitMpv));
    exports.Set(Napi::String::New(env, "play"), Napi::Function::New(env, Play));
    return exports;
}

NODE_API_MODULE(addon, Init)