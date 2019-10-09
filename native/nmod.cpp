#include <napi.h>
#include <Windows.h>
#include <string>
#include "include/client.h"
#include "GenThumbsAsync.h"

// life time with NodeJS main thread.(?)
mpv_handle *ctx = nullptr;
HWND osc = NULL, pwin = NULL;
WNDPROC old_proc = NULL;
std::string conf_path;
GenThumbsAsync *thumbServer = nullptr;

LRESULT CALLBACK _HookWindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    if (uMsg == WM_MOVE || uMsg == WM_SIZE)
    {
        RECT osc_rect;
        GetWindowRect(osc, &osc_rect);
        SetWindowPos(pwin,
                     HWND_TOPMOST,
                     osc_rect.left,
                     osc_rect.top,
                     osc_rect.right - osc_rect.left,
                     osc_rect.bottom - osc_rect.top,
                     SWP_NOZORDER);
    }
    return CallWindowProc(old_proc, hwnd, uMsg, wParam, lParam);
}

Napi::ArrayBuffer InitMpv(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 2)
    {
        Napi::TypeError::New(env, "Need arg:wid to init mpv.").ThrowAsJavaScriptException();
        return Napi::ArrayBuffer::New(env, 0);
    }
    int64_t wid = info[0].As<Napi::Number>().Int32Value();
    ctx = mpv_create();
    mpv_set_property(ctx, "wid", MPV_FORMAT_INT64, &wid);
    Napi::String js_path = info[1].As<Napi::String>();
    conf_path = js_path.Utf8Value();
    conf_path += "\\mpv_config";
    mpv_set_option_string(ctx, "config-dir", conf_path.c_str());
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

Napi::Value BindMove(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 2)
    {
        Napi::TypeError::New(env, "Need arg:file to play.").ThrowAsJavaScriptException();
        return env.Null();
    }
    HWND osc_hwnd = (HWND)(info[0].As<Napi::Number>().Int32Value());
    HWND pwin_hwnd = (HWND)(info[1].As<Napi::Number>().Int32Value());
    osc = osc_hwnd;
    pwin = pwin_hwnd;
    old_proc = (WNDPROC)GetWindowLongPtr(pwin, GWLP_WNDPROC);
    SetWindowLongPtr(osc_hwnd, GWLP_WNDPROC, (LONG_PTR)_HookWindowProc);
    return env.Null();
}

Napi::String GetConfPath(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::String js_path = Napi::String::New(env, conf_path);
    return js_path;
}

Napi::Value GenThumbs(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 4)
    {
        Napi::TypeError::New(env, "Need more args.").ThrowAsJavaScriptException();
        return env.Null();
    }
    Napi::Function cb = info[0].As<Napi::Function>();
    std::string vp = info[1].As<Napi::String>().Utf8Value();
    std::string tp = info[2].As<Napi::String>().Utf8Value();
    int64_t wid = info[3].As<Napi::Number>().Int32Value();

    thumbServer = new GenThumbsAsync(cb, vp, tp, wid);
    thumbServer->Queue();
    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, InitMpv));
    exports.Set(Napi::String::New(env, "bind_window"), Napi::Function::New(env, BindMove));
    exports.Set(Napi::String::New(env, "play"), Napi::Function::New(env, Play));
    exports.Set(Napi::String::New(env, "get_path"), Napi::Function::New(env, GetConfPath));
    exports.Set(Napi::String::New(env, "gen_thumbs"), Napi::Function::New(env, GenThumbs));
    return exports;
}

NODE_API_MODULE(addon, Init)