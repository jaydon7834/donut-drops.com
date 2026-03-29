from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import tkinter as tk
import tkinter.font as tkfont
from pathlib import Path
from typing import Optional

if os.name == "nt":
    import ctypes
    from ctypes import wintypes


RE_PAPER_ENABLED = re.compile(r"Paper Rig Enabled = (true|false)", re.IGNORECASE)
RE_PAPER_WINNER = re.compile(r"Paper Winner = (Host|Viewer)", re.IGNORECASE)

RE_FIFTY_ENABLED = re.compile(r"50/50 Rig Enabled = (true|false)", re.IGNORECASE)
RE_FIFTY_WINNER = re.compile(r"50/50 Winner = (1st Item|2nd Item)", re.IGNORECASE)
RE_FIFTY_ITEM1 = re.compile(r"50/50 1st Item = (?:minecraft:)?([a-z0-9_]+)", re.IGNORECASE)
RE_FIFTY_ITEM2 = re.compile(r"50/50 2nd Item = (?:minecraft:)?([a-z0-9_]+)", re.IGNORECASE)

RE_BLACKJACK_ENABLED = re.compile(r"Blackjack Rig Enabled = (true|false)", re.IGNORECASE)
RE_BLACKJACK_QUEUED = re.compile(r"Blackjack queued force\s*(?::|=)\s*(.+)$", re.IGNORECASE)
RE_RUSSIAN_ARMED = re.compile(r"Russian Roulette armed with (.+)$", re.IGNORECASE)
RE_RUSSIAN_STATE = re.compile(r"Russian Roulette armed = (true|false)", re.IGNORECASE)
RE_RUSSIAN_ENABLED = re.compile(r"Russian Roulette Enabled = (true|false)", re.IGNORECASE)
RE_ALL_RIGS = re.compile(r"All Rigs Enabled = (true|false)", re.IGNORECASE)
RE_RIG_MODE = re.compile(r"Rig Mode = (Paper|50/50|Blackjack|Russian|45/45/10)", re.IGNORECASE)
RE_FAKE_SCOREBOARD = re.compile(r"Fake Scoreboard Enabled = (true|false)", re.IGNORECASE)


GLFW_NAME_MAP = {
    -1: "UNBOUND",
    32: "SPACE",
    39: "APOSTROPHE",
    44: "COMMA",
    45: "MINUS",
    46: "PERIOD",
    47: "SLASH",
    59: "SEMICOLON",
    61: "EQUAL",
    91: "LBRACKET",
    92: "BACKSLASH",
    93: "RBRACKET",
    96: "GRAVE",
    256: "ESC",
    257: "ENTER",
    258: "TAB",
    259: "BACKSPACE",
    260: "INSERT",
    261: "DELETE",
    262: "RIGHT",
    263: "LEFT",
    264: "DOWN",
    265: "UP",
    266: "PAGEUP",
    267: "PAGEDOWN",
    268: "HOME",
    269: "END",
    280: "CAPSLOCK",
    281: "SCROLLLOCK",
    282: "NUMLOCK",
    283: "PRINTSCREEN",
    284: "PAUSE",
    340: "LSHIFT",
    341: "LCTRL",
    342: "LALT",
    344: "RSHIFT",
    345: "RCTRL",
    346: "RALT",
}


class RigState:
    def __init__(self) -> None:
        self.paper_enabled: Optional[bool] = None
        self.paper_winner_side: str = "Host"

        self.fifty_enabled: Optional[bool] = None
        self.fifty_winner_side: str = "1st Item"
        self.fifty_item1: str = "apple"
        self.fifty_item2: str = "diamond"

        self.forty_enabled: Optional[bool] = None
        self.forty_winner: str = "1st (45%)"
        self.forty_item1: str = "stone"
        self.forty_item2: str = "cobblestone"
        self.forty_item_mid: str = "diamond"

        self.blackjack_enabled: Optional[bool] = None
        self.blackjack_forced: str = ""
        self.blackjack_cleared_event: bool = False
        self.roulette_enabled: Optional[bool] = None
        self.roulette_armed: Optional[bool] = False
        self.roulette_trigger: str = "?"
        self.rigging_enabled: Optional[bool] = None
        self.fake_pay_enabled: Optional[bool] = None
        self.fake_scoreboard_enabled: Optional[bool] = None
        self.active_mode: str = "Paper"
        self.last_event: str = "Waiting for log events..."

    def recompute_mode_enabled(self) -> None:
        if self.rigging_enabled is None:
            return

        mode = self.active_mode.lower()
        self.paper_enabled = mode == "paper" and self.rigging_enabled
        self.fifty_enabled = mode == "50/50" and self.rigging_enabled
        self.forty_enabled = mode == "45/45/10" and self.rigging_enabled
        self.blackjack_enabled = mode == "blackjack" and self.rigging_enabled
        self.roulette_enabled = mode == "russian" and self.rigging_enabled

    def apply_line(self, line: str) -> bool:
        text = line.strip()
        if not text:
            return False

        if (m := RE_PAPER_ENABLED.search(text)):
            self.paper_enabled = m.group(1).lower() == "true"
            self.last_event = text
            return True
        if (m := RE_PAPER_WINNER.search(text)):
            self.paper_winner_side = m.group(1).strip()
            self.last_event = text
            return True

        if (m := RE_FIFTY_ENABLED.search(text)):
            self.fifty_enabled = m.group(1).lower() == "true"
            self.last_event = text
            return True
        if (m := RE_FIFTY_WINNER.search(text)):
            self.fifty_winner_side = m.group(1)
            self.last_event = text
            return True
        if (m := RE_FIFTY_ITEM1.search(text)):
            self.fifty_item1 = m.group(1).lower()
            self.last_event = text
            return True
        if (m := RE_FIFTY_ITEM2.search(text)):
            self.fifty_item2 = m.group(1).lower()
            self.last_event = text
            return True

        if (m := RE_BLACKJACK_ENABLED.search(text)):
            self.blackjack_enabled = m.group(1).lower() == "true"
            self.last_event = text
            return True
        if (m := RE_BLACKJACK_QUEUED.search(text)):
            queued = m.group(1).strip()
            previous_forced = self.blackjack_forced
            self.blackjack_forced = "" if queued.lower() == "none" else queued
            if previous_forced and not self.blackjack_forced:
                self.blackjack_cleared_event = True
            self.last_event = text
            return True

        if (m := RE_RUSSIAN_ARMED.search(text)):
            self.roulette_armed = True
            self.roulette_trigger = m.group(1).strip()
            self.last_event = text
            return True
        if (m := RE_RUSSIAN_STATE.search(text)):
            self.roulette_armed = m.group(1).lower() == "true"
            self.last_event = text
            return True
        if (m := RE_RUSSIAN_ENABLED.search(text)):
            self.roulette_enabled = m.group(1).lower() == "true"
            self.last_event = text
            return True
        if (m := RE_ALL_RIGS.search(text)):
            self.rigging_enabled = m.group(1).lower() == "true"
            self.recompute_mode_enabled()
            self.last_event = text
            return True
        if (m := RE_RIG_MODE.search(text)):
            self.active_mode = m.group(1)
            self.recompute_mode_enabled()
            self.last_event = text
            return True
        if (m := RE_FAKE_SCOREBOARD.search(text)):
            self.fake_scoreboard_enabled = m.group(1).lower() == "true"
            self.last_event = text
            return True
        return False

    def paper_winner_label(self) -> str:
        return self.paper_winner_side

    def fifty_winner_item(self) -> str:
        return self.fifty_item1 if self.fifty_winner_side == "1st Item" else self.fifty_item2


class KeyConfig:
    def __init__(self) -> None:
        self.open_menu = "P"
        self.toggle_paper = "Y"
        self.switch_side = "U"
        self.toggle_fifty = "I"
        self.toggle_forty = "G"
        self.switch_forty = "V"
        self.cycle_mode = "N"
        self.toggle_all_rigs = "M"
        self.clear_blackjack_force = "K"
        self.trigger_roulette = "J"
        self.toggle_overlay = "H"
        self.toggle_fake_pay = "L"
        self.spoof_rate_hz = 240
        self.rigging_enabled = True
        self.overlay_enabled = True
        self.fake_pay_enabled = False
        self.fake_scoreboard_enabled = False
        self.active_mode = "Paper"


class ItemConfig:
    def __init__(self) -> None:
        self.paper_host_wins = True
        self.paper_single_item = False
        self.paper_host_suffix = "Host"
        self.paper_viewer_suffix = "Viewer"
        self.fifty_item1 = "apple"
        self.fifty_item2 = "diamond"
        self.forty_first_item = "stone"
        self.forty_second_item = "cobblestone"
        self.forty_middle_item = "diamond"
        self.forty_winner = "FIRST"
        self.russian_trigger_item = "tnt"
        self.russian_normal_item = "paper"


def short_item_name(item_id: object, fallback: str) -> str:
    if not isinstance(item_id, str):
        return fallback
    raw = item_id.strip().lower()
    if not raw:
        return fallback
    if ":" in raw:
        raw = raw.split(":", 1)[1]
    return raw or fallback


def json_int(raw: dict, key: str, default: int) -> int:
    value = raw.get(key, default)
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def json_bool(raw: dict, key: str, default: bool) -> bool:
    value = raw.get(key, default)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes", "on"}:
            return True
        if lowered in {"false", "0", "no", "off"}:
            return False
    return default


def bool_dot(value: Optional[bool]) -> tuple[str, str]:
    if value is True:
        return "●", "#28c76f"
    if value is False:
        return "●", "#ea5455"
    return "●", "#9fa8b3"


def detect_default_log() -> Path:
    candidates = [Path.cwd() / "run" / "logs" / "latest.log"]
    appdata = os.environ.get("APPDATA")
    if appdata:
        candidates.append(Path(appdata) / ".minecraft" / "logs" / "latest.log")

    for path in candidates:
        if path.exists():
            return path
    return candidates[0]


def detect_key_config() -> Path:
    candidates = [Path.cwd() / "run" / "config" / "casinorigger-keys.json"]
    appdata = os.environ.get("APPDATA")
    if appdata:
        candidates.append(Path(appdata) / ".minecraft" / "config" / "casinorigger-keys.json")

    for path in candidates:
        if path.exists():
            return path
    return candidates[0]


def detect_item_config() -> Path:
    candidates = [Path.cwd() / "run" / "config" / "casinorigger-items.json"]
    appdata = os.environ.get("APPDATA")
    if appdata:
        candidates.append(Path(appdata) / ".minecraft" / "config" / "casinorigger-items.json")

    for path in candidates:
        if path.exists():
            return path
    return candidates[0]


def glfw_name(code: int) -> str:
    if code in GLFW_NAME_MAP:
        return GLFW_NAME_MAP[code]
    if 48 <= code <= 57:
        return chr(code)
    if 65 <= code <= 90:
        return chr(code)
    if 290 <= code <= 314:
        return f"F{code - 289}"
    if 320 <= code <= 329:
        return f"KP_{code - 320}"
    return str(code)


def load_key_config(path: Path) -> KeyConfig:
    cfg = KeyConfig()
    if not path.exists():
        return cfg

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return cfg

    cfg.open_menu = glfw_name(json_int(raw, "openMenuKeyCode", 80))
    cfg.toggle_paper = glfw_name(json_int(raw, "togglePaperKeyCode", 89))
    cfg.switch_side = glfw_name(json_int(raw, "switchSideKeyCode", 85))
    cfg.toggle_fifty = glfw_name(json_int(raw, "toggleFiftyFiftyKeyCode", 73))
    cfg.toggle_forty = glfw_name(json_int(raw, "toggleFortyFiveTenKeyCode", 71))
    cfg.switch_forty = glfw_name(json_int(raw, "switchFortyFiveTenKeyCode", 86))
    cfg.cycle_mode = glfw_name(json_int(raw, "cycleModeKeyCode", 78))
    cfg.toggle_all_rigs = glfw_name(json_int(raw, "toggleAllRigsKeyCode", 77))
    cfg.clear_blackjack_force = glfw_name(json_int(raw, "clearBlackjackForceKeyCode", 75))
    cfg.trigger_roulette = glfw_name(json_int(raw, "triggerRussianRouletteKeyCode", 74))
    cfg.toggle_overlay = glfw_name(json_int(raw, "toggleOverlayKeyCode", 72))
    cfg.toggle_fake_pay = glfw_name(json_int(raw, "toggleFakePayKeyCode", 76))
    cfg.spoof_rate_hz = json_int(raw, "spoofRateHz", 240)
    cfg.rigging_enabled = json_bool(raw, "riggingEnabled", True)
    cfg.overlay_enabled = json_bool(raw, "overlayEnabled", True)
    cfg.fake_pay_enabled = json_bool(raw, "fakePayEnabled", False)
    cfg.fake_scoreboard_enabled = json_bool(raw, "fakeScoreboardEnabled", False)

    mode_raw = str(raw.get("activeRigMode", "PAPER")).upper()
    if mode_raw == "FIFTY":
        cfg.active_mode = "50/50"
    elif mode_raw == "BLACKJACK":
        cfg.active_mode = "Blackjack"
    elif mode_raw == "RUSSIAN":
        cfg.active_mode = "Russian"
    elif mode_raw in {"FORTY_FIVE_TEN", "FORTYFIVE_TEN"}:
        cfg.active_mode = "45/45/10"
    else:
        cfg.active_mode = "Paper"
    return cfg


def load_item_config(path: Path) -> ItemConfig:
    cfg = ItemConfig()
    if not path.exists():
        return cfg

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return cfg

    cfg.paper_host_wins = json_bool(raw, "paperHostWins", cfg.paper_host_wins)
    cfg.paper_single_item = json_bool(raw, "paperSingleItem", cfg.paper_single_item)
    cfg.paper_host_suffix = str(raw.get("paperHostSuffix", cfg.paper_host_suffix) or cfg.paper_host_suffix).strip()
    cfg.paper_viewer_suffix = str(raw.get("paperViewerSuffix", cfg.paper_viewer_suffix) or cfg.paper_viewer_suffix).strip()

    cfg.fifty_item1 = short_item_name(raw.get("fiftyLeftItemId"), cfg.fifty_item1)
    cfg.fifty_item2 = short_item_name(raw.get("fiftyRightItemId"), cfg.fifty_item2)
    cfg.forty_first_item = short_item_name(raw.get("fortyFiveTenFirstItemId"), cfg.forty_first_item)
    cfg.forty_second_item = short_item_name(raw.get("fortyFiveTenSecondItemId"), cfg.forty_second_item)
    cfg.forty_middle_item = short_item_name(raw.get("fortyFiveTenMiddleItemId"), cfg.forty_middle_item)
    cfg.forty_winner = str(raw.get("fortyFiveTenWinner", cfg.forty_winner) or cfg.forty_winner).upper()
    cfg.russian_trigger_item = short_item_name(raw.get("russianTriggerItemId"), cfg.russian_trigger_item)
    cfg.russian_normal_item = short_item_name(raw.get("russianNormalItemId"), cfg.russian_normal_item)
    return cfg


def _is_windows() -> bool:
    return os.name == "nt"


def _window_pid(hwnd: int) -> Optional[int]:
    if not _is_windows() or hwnd <= 0 or not _is_window(hwnd):
        return None
    pid = wintypes.DWORD()
    ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return int(pid.value) if pid.value else None


def _window_text(hwnd: int) -> str:
    if not _is_windows() or hwnd <= 0:
        return ""
    length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buf = ctypes.create_unicode_buffer(length + 1)
    ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
    return buf.value


def _window_class(hwnd: int) -> str:
    if not _is_windows() or hwnd <= 0:
        return ""
    buf = ctypes.create_unicode_buffer(256)
    if ctypes.windll.user32.GetClassNameW(hwnd, buf, len(buf)) <= 0:
        return ""
    return buf.value


def _window_rect(hwnd: int) -> Optional[tuple[int, int, int, int]]:
    if not _is_windows() or hwnd <= 0:
        return None
    rect = wintypes.RECT()
    if ctypes.windll.user32.GetWindowRect(hwnd, ctypes.byref(rect)) == 0:
        return None
    return rect.left, rect.top, rect.right, rect.bottom


def _is_window(hwnd: Optional[int]) -> bool:
    if not _is_windows() or hwnd is None or hwnd <= 0:
        return False
    return ctypes.windll.user32.IsWindow(hwnd) != 0


def _is_window_visible(hwnd: int) -> bool:
    if not _is_windows() or hwnd <= 0:
        return False
    return ctypes.windll.user32.IsWindowVisible(hwnd) != 0


def _is_minecraft_window(hwnd: int) -> bool:
    if not _is_windows() or hwnd <= 0 or not _is_window(hwnd):
        return False
    if not _is_window_visible(hwnd):
        return False
    title = _window_text(hwnd).strip().lower()
    if not title:
        return False
    if "minecraft" in title:
        return True
    class_name = _window_class(hwnd).strip().lower()
    return class_name.startswith("glfw") and any(
        token in title for token in ("singleplayer", "multiplayer", "fabric", "forge", "modded")
    )


def _enumerate_top_windows() -> list[int]:
    if not _is_windows():
        return []
    windows: list[int] = []
    enum_proc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

    def _callback(hwnd: int, _lparam: int) -> bool:
        windows.append(int(hwnd))
        return True

    callback_ptr = enum_proc(_callback)
    ctypes.windll.user32.EnumWindows(callback_ptr, 0)
    return windows


def _find_minecraft_window(preferred_hwnd: Optional[int], preferred_pid: Optional[int]) -> Optional[int]:
    if not _is_windows():
        return None

    if preferred_hwnd is not None and _is_window(preferred_hwnd):
        if preferred_pid is None or _window_pid(preferred_hwnd) == preferred_pid:
            return preferred_hwnd

    foreground = int(ctypes.windll.user32.GetForegroundWindow())
    if _is_window(foreground) and preferred_pid is not None and _window_pid(foreground) == preferred_pid:
        return foreground
    if _is_minecraft_window(foreground):
        return foreground

    if preferred_pid is not None:
        best_pid_hwnd: Optional[int] = None
        best_pid_area = -1
        for hwnd in _enumerate_top_windows():
            if not _is_window(hwnd):
                continue
            if _window_pid(hwnd) != preferred_pid:
                continue
            rect = _window_rect(hwnd)
            if rect is None:
                continue
            area = max(1, rect[2] - rect[0]) * max(1, rect[3] - rect[1])
            if area > best_pid_area:
                best_pid_area = area
                best_pid_hwnd = hwnd
        if best_pid_hwnd is not None:
            return best_pid_hwnd

    best_hwnd: Optional[int] = None
    best_area = -1
    for hwnd in _enumerate_top_windows():
        if not _is_minecraft_window(hwnd):
            continue
        rect = _window_rect(hwnd)
        if rect is None:
            continue
        area = max(1, rect[2] - rect[0]) * max(1, rect[3] - rect[1])
        if area > best_area:
            best_area = area
            best_hwnd = hwnd
    return best_hwnd


def _set_owner_window(child_hwnd: int, owner_hwnd: int) -> None:
    if not _is_windows() or not _is_window(child_hwnd) or not _is_window(owner_hwnd):
        return
    try:
        if ctypes.sizeof(ctypes.c_void_p) == 8:
            ctypes.windll.user32.SetWindowLongPtrW(child_hwnd, -8, owner_hwnd)
        else:
            ctypes.windll.user32.SetWindowLongW(child_hwnd, -8, owner_hwnd)
    except Exception:
        pass


def _set_topmost(hwnd: int) -> None:
    if not _is_windows() or not _is_window(hwnd):
        return
    try:
        flags = 0x0001 | 0x0002 | 0x0010 | 0x0040
        ctypes.windll.user32.SetWindowPos(hwnd, -1, 0, 0, 0, 0, flags)
    except Exception:
        pass


class OverlayApp:
    def __init__(
        self,
        log_path: Path,
        key_config_path: Path,
        item_config_path: Path,
        interval_ms: int,
        preferred_minecraft_hwnd: Optional[int] = None,
        preferred_minecraft_pid: Optional[int] = None,
    ) -> None:
        self.log_path = log_path
        self.key_config_path = key_config_path
        self.item_config_path = item_config_path
        self.interval_ms = interval_ms
        self.state = RigState()
        self.keys = load_key_config(self.key_config_path)
        self.items = load_item_config(self.item_config_path)
        self._sync_state_from_config()
        self.file_pos = 0
        self.blackjack_cleared_until = 0.0

        self.root = tk.Tk()
        self.root.title("Verz Rig Overlay")
        self.root.attributes("-topmost", True)
        self._taskbar_icon: Optional[tk.PhotoImage] = None
        self._apply_dollar_taskbar_icon()
        self._bg_color = "#101218"
        self.root.configure(bg=self._bg_color)
        self.root.attributes("-alpha", 0.92)
        self.base_width = 360
        self.base_height = 150
        self.root.geometry(f"{self.base_width}x{self.base_height}+0+0")
        self.root.minsize(240, 110)
        self.root.resizable(True, True)
        self._apply_windows_titlebar_blend()

        self._drag_x = 0
        self._drag_y = 0
        self._dragging = False
        self._overlay_hwnd: Optional[int] = None
        self._minecraft_hwnd: Optional[int] = None
        self._bound_minecraft_hwnd: Optional[int] = None
        self._preferred_minecraft_hwnd: Optional[int] = preferred_minecraft_hwnd if preferred_minecraft_hwnd and preferred_minecraft_hwnd > 0 else None
        self._preferred_minecraft_pid: Optional[int] = preferred_minecraft_pid if preferred_minecraft_pid and preferred_minecraft_pid > 0 else None
        self._overlay_minimized_by_minecraft = False
        self._running = True
        self.root.bind("<ButtonPress-1>", self._start_drag)
        self.root.bind("<B1-Motion>", self._on_drag)
        self.root.bind("<ButtonRelease-1>", self._end_drag)

        self.paper_var = tk.StringVar(value="Paper: ?")
        self.fifty_var = tk.StringVar(value="50/50: ?")
        self.forty_var = tk.StringVar(value="45/45/10: ?")
        self.blackjack_var = tk.StringVar(value="Blackjack: ?")
        self.russian_var = tk.StringVar(value="Russian: ?")
        self.fake_pay_var = tk.StringVar(value="Fake Pay: ?")
        self.fake_scoreboard_var = tk.StringVar(value="Scoreboard: ?")
        self.main_font = tkfont.Font(family="Consolas", size=11)
        self._current_font_size = 11

        self.lbl_paper = tk.Label(self.root, textvariable=self.paper_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.lbl_fifty = tk.Label(self.root, textvariable=self.fifty_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.lbl_forty = tk.Label(self.root, textvariable=self.forty_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.lbl_blackjack = tk.Label(self.root, textvariable=self.blackjack_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.lbl_russian = tk.Label(self.root, textvariable=self.russian_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.lbl_fake_pay = tk.Label(self.root, textvariable=self.fake_pay_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.lbl_fake_scoreboard = tk.Label(self.root, textvariable=self.fake_scoreboard_var, fg="#f2f2f2", bg=self._bg_color, anchor="w", font=self.main_font)
        self.row_labels = (
            self.lbl_paper,
            self.lbl_fifty,
            self.lbl_forty,
            self.lbl_blackjack,
            self.lbl_russian,
            self.lbl_fake_pay,
            self.lbl_fake_scoreboard,
        )

        for w in self.row_labels:
            w.pack(fill="x", padx=10, pady=(6 if w is self.lbl_paper else 2, 0))

        self._read_existing()
        self._refresh_view()
        self._link_to_minecraft_window()
        self._follow_minecraft_window()
        self.root.bind("<Configure>", self._on_resize)
        self.root.after(self.interval_ms, self._poll)

    def _start_drag(self, event: tk.Event) -> None:
        self._drag_x = event.x
        self._drag_y = event.y
        self._dragging = True

    def _on_drag(self, event: tk.Event) -> None:
        x = self.root.winfo_x() + event.x - self._drag_x
        y = self.root.winfo_y() + event.y - self._drag_y
        self.root.geometry(f"+{x}+{y}")

    def _end_drag(self, _event: tk.Event) -> None:
        self._dragging = False

    def _on_resize(self, event: tk.Event) -> None:
        if event.widget is not self.root:
            return

        width = max(event.width, 1)
        height = max(event.height, 1)
        scale = min(width / self.base_width, height / self.base_height)
        scale = max(0.75, min(2.6, scale))

        font_size = max(9, int(round(11 * scale)))
        if font_size != self._current_font_size:
            self.main_font.configure(size=font_size)
            self._current_font_size = font_size

        padx = max(6, int(round(10 * (width / self.base_width))))
        top_pady = max(3, int(round(6 * (height / self.base_height))))
        row_pady = max(1, int(round(2 * (height / self.base_height))))
        for idx, label in enumerate(self.row_labels):
            label.pack_configure(padx=padx, pady=(top_pady if idx == 0 else row_pady, 0))

    def _read_existing(self) -> None:
        if not self.log_path.exists():
            self.state.last_event = f"Log not found yet: {self.log_path}"
            return
        try:
            with self.log_path.open("r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    self.state.apply_line(line)
                self.file_pos = f.tell()
                self.state.blackjack_cleared_event = False
        except OSError as exc:
            self.state.last_event = f"Failed to read log: {exc}"

    def _sync_state_from_config(self) -> None:
        self.state.rigging_enabled = self.keys.rigging_enabled
        self.state.fake_pay_enabled = self.keys.fake_pay_enabled
        self.state.fake_scoreboard_enabled = self.keys.fake_scoreboard_enabled
        self.state.active_mode = self.keys.active_mode
        if self.items.paper_single_item:
            self.state.paper_winner_side = "1st Item" if self.items.paper_host_wins else "2nd Item"
        else:
            self.state.paper_winner_side = "Host" if self.items.paper_host_wins else "Viewer"
        self.state.fifty_item1 = self.items.fifty_item1
        self.state.fifty_item2 = self.items.fifty_item2
        self.state.forty_item1 = self.items.forty_first_item
        self.state.forty_item2 = self.items.forty_second_item
        self.state.forty_item_mid = self.items.forty_middle_item
        winner = self.items.forty_winner
        if winner == "SECOND":
            self.state.forty_winner = "2nd (45%)"
        elif winner == "MIDDLE":
            self.state.forty_winner = "Middle (10%)"
        else:
            self.state.forty_winner = "1st (45%)"
        self.state.recompute_mode_enabled()

    def _poll(self) -> None:
        if not self._running:
            return

        changed = False

        self.keys = load_key_config(self.key_config_path)
        self.items = load_item_config(self.item_config_path)
        self._sync_state_from_config()

        if self.log_path.exists():
            try:
                with self.log_path.open("r", encoding="utf-8", errors="ignore") as f:
                    f.seek(0, os.SEEK_END)
                    end = f.tell()
                    if end < self.file_pos:
                        self.file_pos = 0
                    f.seek(self.file_pos)
                    for line in f:
                        changed = self.state.apply_line(line) or changed
                    self.file_pos = f.tell()
            except OSError as exc:
                self.state.last_event = f"Log read error: {exc}"
                changed = True
        else:
            self.state.last_event = f"Waiting for log: {self.log_path}"
            changed = True

        if self.state.blackjack_cleared_event:
            self.blackjack_cleared_until = time.monotonic() + 2.0
            self.state.blackjack_cleared_event = False

        self._refresh_view()
        self._follow_minecraft_window()
        if self._running:
            self.root.after(self.interval_ms, self._poll)

    def _refresh_view(self) -> None:
        p_dot, p_color = bool_dot(self.state.paper_enabled)
        f_dot, f_color = bool_dot(self.state.fifty_enabled)
        t_dot, t_color = bool_dot(self.state.forty_enabled)
        b_dot, b_color = bool_dot(self.state.blackjack_enabled)
        r_dot, r_color = bool_dot(self.state.roulette_enabled)
        a_dot, _ = bool_dot(self.state.roulette_armed)
        fp_dot, fp_color = bool_dot(self.state.fake_pay_enabled)
        fs_dot, fs_color = bool_dot(self.state.fake_scoreboard_enabled)

        paper_mode = "SINGLE" if self.items.paper_single_item else "MULTI"
        paper_winner = self.state.paper_winner_label()
        suffixes = ""
        if not self.items.paper_single_item:
            hs = self.items.paper_host_suffix
            vs = self.items.paper_viewer_suffix
            suffixes = f"  H='{hs}' V='{vs}'"
        self.paper_var.set(f"Paper      {p_dot}  [{self.keys.toggle_paper}/{self.keys.switch_side}]  {paper_mode}  Winner {paper_winner}{suffixes}")
        self.fifty_var.set(
            f"50/50      {f_dot}  [{self.keys.toggle_fifty}/{self.keys.switch_side}]  {self.state.fifty_winner_item()}"
        )
        self.forty_var.set(
            f"45/45/10  {t_dot}  [{self.keys.toggle_forty}/{self.keys.switch_forty}]  {self.state.forty_winner}"
        )
        blackjack_line = f"Blackjack  {b_dot}  [{self.keys.clear_blackjack_force}]"
        if self.state.blackjack_forced:
            blackjack_line += f"  Pending {self.state.blackjack_forced}"
        elif time.monotonic() < self.blackjack_cleared_until:
            blackjack_line += "  Pending cleared"
        self.blackjack_var.set(blackjack_line)
        if self.state.roulette_armed is True:
            armed_state = "ARMED"
        elif self.state.roulette_armed is False:
            armed_state = ""
        else:
            armed_state = "?"
        russian_line = f"Russian    {r_dot}  Arm {a_dot}  [{self.keys.trigger_roulette}]  {armed_state}"
        self.russian_var.set(russian_line)
        self.fake_pay_var.set(f"Fake Pay  {fp_dot}  [{self.keys.toggle_fake_pay}]")
        self.fake_scoreboard_var.set(f"Scoreboard {fs_dot}")

        self.lbl_paper.configure(fg=p_color)
        self.lbl_fifty.configure(fg=f_color)
        self.lbl_forty.configure(fg=t_color)
        self.lbl_blackjack.configure(fg=b_color)
        self.lbl_russian.configure(fg=r_color)
        self.lbl_fake_pay.configure(fg=fp_color)
        self.lbl_fake_scoreboard.configure(fg=fs_color)
        self._auto_fit_to_content()

    def _auto_fit_to_content(self) -> None:
        lines = [
            self.paper_var.get(),
            self.fifty_var.get(),
            self.forty_var.get(),
            self.blackjack_var.get(),
            self.russian_var.get(),
            self.fake_pay_var.get(),
            self.fake_scoreboard_var.get(),
        ]
        words = [word for line in lines for word in line.split()]
        longest_word_px = max((self.main_font.measure(word) for word in words), default=0)

        self.root.update_idletasks()
        widest_line_px = max((label.winfo_reqwidth() for label in self.row_labels), default=0)
        total_height_px = sum(label.winfo_reqheight() for label in self.row_labels)

        target_width = max(240, widest_line_px + 24, longest_word_px + 170)
        target_height = max(110, total_height_px + 20)

        self.base_width = target_width
        self.base_height = target_height
        self.root.minsize(max(220, longest_word_px + 100), 100)

        if self.root.state() != "normal":
            return

        current_width = self.root.winfo_width()
        current_height = self.root.winfo_height()
        if abs(current_width - target_width) > 2 or abs(current_height - target_height) > 2:
            self.root.geometry(f"{target_width}x{target_height}+{self.root.winfo_x()}+{self.root.winfo_y()}")

    def _overlay_window_handle(self) -> Optional[int]:
        if not _is_windows():
            return None
        if self._overlay_hwnd is not None and _is_window(self._overlay_hwnd):
            return self._overlay_hwnd
        try:
            self.root.update_idletasks()
            base = int(self.root.winfo_id())
            hwnd = int(
                ctypes.windll.user32.GetAncestor(base, 2)
                or ctypes.windll.user32.GetParent(base)
                or base
            )
        except Exception:
            return None
        self._overlay_hwnd = hwnd if _is_window(hwnd) else None
        return self._overlay_hwnd

    def _link_to_minecraft_window(self) -> None:
        if not _is_windows():
            return

        if self._bound_minecraft_hwnd is not None:
            if not _is_window(self._bound_minecraft_hwnd):
                self._request_close("Minecraft window closed")
                return
            if self._preferred_minecraft_pid is not None:
                if _window_pid(self._bound_minecraft_hwnd) != self._preferred_minecraft_pid:
                    self._request_close("Minecraft window changed")
                    return
            self._minecraft_hwnd = self._bound_minecraft_hwnd
            return

        new_hwnd = _find_minecraft_window(self._preferred_minecraft_hwnd, self._preferred_minecraft_pid)
        if new_hwnd is None:
            return

        overlay_hwnd = self._overlay_window_handle()
        if overlay_hwnd is not None:
            _set_topmost(overlay_hwnd)
        try:
            self.root.attributes("-topmost", True)
        except Exception:
            pass

        self._minecraft_hwnd = new_hwnd
        self._bound_minecraft_hwnd = new_hwnd

    def _follow_minecraft_window(self) -> None:
        if not _is_windows():
            return

        self._link_to_minecraft_window()
        if self._minecraft_hwnd is None or not _is_window(self._minecraft_hwnd):
            if self._bound_minecraft_hwnd is not None:
                self._request_close("Minecraft window closed")
            return

        if self._preferred_minecraft_pid is not None and _window_pid(self._minecraft_hwnd) != self._preferred_minecraft_pid:
            self._request_close("Minecraft process ended")
            return

        overlay_state = self.root.state()
        minecraft_iconic = ctypes.windll.user32.IsIconic(self._minecraft_hwnd) != 0

        if minecraft_iconic:
            if overlay_state != "iconic":
                self._overlay_minimized_by_minecraft = True
                self.root.iconify()
            return

        if self._overlay_minimized_by_minecraft and overlay_state in {"iconic", "withdrawn"}:
            self.root.deiconify()
            try:
                self.root.attributes("-topmost", True)
            except Exception:
                pass
            self._overlay_minimized_by_minecraft = False

        overlay_hwnd = self._overlay_window_handle()
        if overlay_hwnd is not None:
            _set_topmost(overlay_hwnd)
        try:
            self.root.attributes("-topmost", True)
        except Exception:
            pass

    def _request_close(self, _reason: str = "") -> None:
        if not self._running:
            return
        self._running = False
        try:
            self.root.after(0, self.root.destroy)
        except Exception:
            pass

    def _apply_windows_titlebar_blend(self) -> None:
        if os.name != "nt":
            return
        try:
            import ctypes

            self.root.update_idletasks()
            hwnd = ctypes.windll.user32.GetParent(self.root.winfo_id()) or self.root.winfo_id()
            dwm = ctypes.windll.dwmapi

            # Windows 11/10 dark title bar support.
            dark = ctypes.c_int(1)
            for attr in (20, 19):
                dwm.DwmSetWindowAttribute(hwnd, attr, ctypes.byref(dark), ctypes.sizeof(dark))

            # Blend title bar with overlay background color (#101218).
            caption_color = ctypes.c_int(0x00181210)  # COLORREF (BBGGRR)
            text_color = ctypes.c_int(0x00FFFFFF)  # white
            dwm.DwmSetWindowAttribute(hwnd, 35, ctypes.byref(caption_color), ctypes.sizeof(caption_color))
            dwm.DwmSetWindowAttribute(hwnd, 36, ctypes.byref(text_color), ctypes.sizeof(text_color))

            # Rounded corners (Windows 11+).
            corner_pref = ctypes.c_int(2)
            dwm.DwmSetWindowAttribute(hwnd, 33, ctypes.byref(corner_pref), ctypes.sizeof(corner_pref))
        except Exception:
            # Keep default title bar on unsupported systems.
            pass

    def _apply_dollar_taskbar_icon(self) -> None:
        try:
            icon = tk.PhotoImage(width=32, height=32)
            icon.put("#0f1116", to=(0, 0, 32, 32))
            icon.put("#212733", to=(1, 1, 31, 31))
            gold = "#f2c94c"

            for y in range(5, 27):
                icon.put(gold, (16, y))
            for x in range(9, 23):
                icon.put(gold, (x, 7))
                icon.put(gold, (x, 15))
                icon.put(gold, (x, 23))
            for y in range(7, 15):
                icon.put(gold, (9, y))
            for y in range(15, 23):
                icon.put(gold, (22, y))

            self._taskbar_icon = icon
            self.root.iconphoto(True, icon)
        except Exception:
            pass

    def run(self) -> None:
        self.root.mainloop()


def main() -> int:
    parser = argparse.ArgumentParser(description="Standalone CasinoRigger overlay window")
    parser.add_argument("--log", type=Path, default=None, help="Path to latest.log")
    parser.add_argument("--keys", type=Path, default=None, help="Path to casinorigger-keys.json")
    parser.add_argument("--items", type=Path, default=None, help="Path to casinorigger-items.json")
    parser.add_argument("--interval-ms", type=int, default=300, help="Log polling interval")
    parser.add_argument("--minecraft-hwnd", type=int, default=None, help="Optional Win32 HWND of the Minecraft window")
    parser.add_argument("--minecraft-pid", type=int, default=None, help="Optional PID of the Minecraft process")

    parser.add_argument("--config-dir", type=Path, default=None, help="Compatibility: folder containing casinorigger-keys.json")
    parser.add_argument("--logs-dir", type=Path, default=None, help="Compatibility: folder containing latest.log")
    parser.add_argument("--refresh-ms", type=int, default=None, help="Compatibility alias for --interval-ms")

    args = parser.parse_args()

    if args.keys is not None:
        key_path = args.keys
    elif args.config_dir is not None:
        key_path = args.config_dir / "casinorigger-keys.json"
    else:
        key_path = detect_key_config()

    if args.items is not None:
        item_path = args.items
    elif args.config_dir is not None:
        item_path = args.config_dir / "casinorigger-items.json"
    elif args.keys is not None and args.keys.parent is not None:
        item_path = args.keys.parent / "casinorigger-items.json"
    else:
        item_path = detect_item_config()

    if args.log is not None:
        log_path = args.log
    elif args.logs_dir is not None:
        log_path = args.logs_dir / "latest.log"
    else:
        log_path = detect_default_log()

    interval_ms = args.refresh_ms if args.refresh_ms is not None else args.interval_ms
    app = OverlayApp(
        log_path=log_path,
        key_config_path=key_path,
        item_config_path=item_path,
        interval_ms=max(100, interval_ms),
        preferred_minecraft_hwnd=args.minecraft_hwnd,
        preferred_minecraft_pid=args.minecraft_pid,
    )
    app.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
