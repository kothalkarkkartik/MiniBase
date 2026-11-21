import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

INPUT_PPTX = r'c:\Users\user\Downloads\BIGCE_Card_1_Official.pptx'
OUTPUT_PPTX_DL = r'c:\Users\user\Downloads\MiniBase_Project_Seminar_BIGCE.pptx'
OUTPUT_PPTX_WS = r'd:\minibase\MiniBase_Project_Seminar_BIGCE.pptx'
OUTPUT_PPTX_BRAIN = r'C:\Users\user\.gemini\antigravity\brain\9a3dfbf7-d267-421b-b672-15c1257252f7\MiniBase_Project_Seminar_BIGCE.pptx'

IMG_DIR = r'C:\Users\user\.gemini\antigravity\brain\9a3dfbf7-d267-421b-b672-15c1257252f7\images'
IMAGES = {
    'login': os.path.join(IMG_DIR, '01_login_page.png'),
    'admin_studio': os.path.join(IMG_DIR, '02_admin_studio_dashboard.png'),
    'admins_modal': os.path.join(IMG_DIR, '03_admins_modal.png'),
    'import_export': os.path.join(IMG_DIR, '04_import_export_modal.png'),
    'api_docs': os.path.join(IMG_DIR, '05_interactive_api_docs.png'),
    'auth_portal': os.path.join(IMG_DIR, '06_user_auth_portal.png'),
    'cli_suite': os.path.join(IMG_DIR, '07_terminal_cli_suite.png'),
    'demo_app': os.path.join(IMG_DIR, '08_wallpaper_app_client.png'),
    'logo': os.path.join(IMG_DIR, 'minibase-logo.png')
}

# Pure Black & White Retro Theme
BLACK = RGBColor(0, 0, 0)           # #000000 Solid Black
WHITE = RGBColor(255, 255, 255)     # #FFFFFF Pure White
PAGE_BG = RGBColor(248, 248, 248)   # #F8F8F8 Vintage Paper
LIGHT_GRAY = RGBColor(242, 242, 242)# #F2F2F2
MID_GRAY = RGBColor(100, 100, 100)  # #646464
DARK_GRAY = RGBColor(40, 40, 40)    # #282828

def update_slide_1(slide):
    """Updates Slide 1 with student and project details without altering template structure."""
    # Shape 24 (Text 22) - Project Title & Category
    s24 = slide.shapes[24]
    tf24 = s24.text_frame
    p0 = tf24.paragraphs[0]
    p0.text = ""
    r0 = p0.add_run()
    r0.text = "MINIBASE: EMBEDDED NODE.JS & SQLITE BACKEND-AS-A-SERVICE\n"
    r0.font.name = "Arial"
    r0.font.size = Pt(14.5)
    r0.font.bold = True
    r0.font.color.rgb = RGBColor(114, 39, 36) # Original maroon for official template card

    r1 = p0.add_run()
    r1.text = "Category: Regular Batch   |   Team ID: TEAM-01   |   Degree: Bachelor of Technology (B.Tech)"
    r1.font.name = "Arial"
    r1.font.size = Pt(8.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(51, 65, 85)

    # Shape 29 (Text 27) - Leader: Kartik Kishor Kothalkar
    s29 = slide.shapes[29]
    tf29 = s29.text_frame
    p29 = tf29.paragraphs[0]
    p29.text = ""
    r29_0 = p29.add_run()
    r29_0.text = "01. KARTIK KISHOR KOTHALKAR "
    r29_0.font.name = "Arial"
    r29_0.font.size = Pt(9.5)
    r29_0.font.bold = True
    r29_0.font.color.rgb = RGBColor(114, 39, 36)

    r29_1 = p29.add_run()
    r29_1.text = " [LEADER] "
    r29_1.font.name = "Arial"
    r29_1.font.size = Pt(8.0)
    r29_1.font.bold = True
    r29_1.font.color.rgb = RGBColor(192, 86, 33)

    r29_2 = p29.add_run()
    r29_2.text = " | PRN No: 23062191242009"
    r29_2.font.name = "Arial"
    r29_2.font.size = Pt(8.5)
    r29_2.font.bold = False
    r29_2.font.color.rgb = RGBColor(51, 65, 85)

    # Members 2, 3, 4
    for idx in [31, 33, 35]:
        s = slide.shapes[idx]
        s.text_frame.paragraphs[0].text = "---"
        s.text_frame.paragraphs[0].runs[0].font.size = Pt(8.5)
        s.text_frame.paragraphs[0].runs[0].font.color.rgb = MID_GRAY

    # Shape 40 (Text 38) - Project Guide
    s40 = slide.shapes[40]
    tf40 = s40.text_frame
    p40 = tf40.paragraphs[0]
    p40.text = ""
    r40_0 = p40.add_run()
    r40_0.text = "PROJECT GUIDE\n"
    r40_0.font.name = "Arial"
    r40_0.font.size = Pt(7.0)
    r40_0.font.bold = True
    r40_0.font.color.rgb = MID_GRAY

    r40_1 = p40.add_run()
    r40_1.text = "Prof. Anand R. Gyanbote\n"
    r40_1.font.name = "Arial"
    r40_1.font.size = Pt(9.5)
    r40_1.font.bold = True
    r40_1.font.color.rgb = RGBColor(114, 39, 36)

    r40_2 = p40.add_run()
    r40_2.text = "HOD, Dept. of CSE"
    r40_2.font.name = "Arial"
    r40_2.font.size = Pt(7.0)
    r40_2.font.bold = False
    r40_2.font.color.rgb = DARK_GRAY

def create_bw_slide(prs, title, slide_num, total_slides=20):
    """Creates a slide with the 100% Black & White retro/neobrutalist styling."""
    blank_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(blank_layout)

    # Background Fill: #F8F8F8
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(10), Inches(5.625))
    bg.fill.solid()
    bg.fill.fore_color.rgb = PAGE_BG
    bg.line.fill.background()

    # Top Solid Black Header Bar (6px)
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(10), Inches(0.08))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = BLACK
    top_bar.line.fill.background()

    # Slide Title Box
    t_box = slide.shapes.add_textbox(Inches(0.55), Inches(0.25), Inches(7.0), Inches(0.55))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = title.upper()
    p_t.font.name = "Arial"
    p_t.font.size = Pt(17.0)
    p_t.font.bold = True
    p_t.font.color.rgb = BLACK

    # Badge Top Right (Solid Black with 3px shadow)
    # Shadow
    b_sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.84), Inches(0.28), Inches(1.6), Inches(0.36))
    b_sh.fill.solid()
    b_sh.fill.fore_color.rgb = BLACK
    b_sh.line.fill.background()
    # Front Badge
    b_fg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.8), Inches(0.24), Inches(1.6), Inches(0.36))
    b_fg.fill.solid()
    b_fg.fill.fore_color.rgb = BLACK
    b_fg.line.color.rgb = BLACK
    b_fg.line.width = Pt(1.5)
    tf_b = b_fg.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = f"SLIDE {slide_num:02d} / {total_slides:02d}"
    p_b.font.name = "Arial"
    p_b.font.size = Pt(8.5)
    p_b.font.bold = True
    p_b.font.color.rgb = WHITE

    # Solid 2.5pt Black Horizontal Divider
    divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(0.88), Inches(8.9), Inches(0.025))
    divider.fill.solid()
    divider.fill.fore_color.rgb = BLACK
    divider.line.fill.background()

    # Solid 2pt Black Footer Line
    f_divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(5.12), Inches(8.9), Inches(0.02))
    f_divider.fill.solid()
    f_divider.fill.fore_color.rgb = BLACK
    f_divider.line.fill.background()

    # Footer Left
    f_left = slide.shapes.add_textbox(Inches(0.55), Inches(5.16), Inches(6.5), Inches(0.3))
    tf_fl = f_left.text_frame
    p_fl = tf_fl.paragraphs[0]
    p_fl.text = "MINIBASE — EMBEDDED NODE.JS BAAS  |  KARTIK KISHOR KOTHALKAR (PRN: 23062191242009)"
    p_fl.font.name = "Arial"
    p_fl.font.size = Pt(7.5)
    p_fl.font.bold = True
    p_fl.font.color.rgb = BLACK

    # Footer Right
    f_right = slide.shapes.add_textbox(Inches(7.3), Inches(5.16), Inches(2.15), Inches(0.3))
    tf_fr = f_right.text_frame
    p_fr = tf_fr.paragraphs[0]
    p_fr.alignment = PP_ALIGN.RIGHT
    p_fr.text = "BIGCE SOLAPUR | CSE"
    p_fr.font.name = "Arial"
    p_fr.font.size = Pt(7.5)
    p_fr.font.bold = True
    p_fr.font.color.rgb = BLACK

    return slide

def add_bw_card(slide, left, top, width, height, title, items, is_dark=False):
    """Draws a retro card with 3px solid black drop shadow."""
    offset = Inches(0.04)

    # 1. Solid Black Drop Shadow
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left + offset, top + offset, width, height)
    sh.fill.solid()
    sh.fill.fore_color.rgb = BLACK
    sh.line.fill.background()

    # 2. Main Card
    card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = BLACK if is_dark else WHITE
    card.line.color.rgb = BLACK
    card.line.width = Pt(2.0)

    # 3. Content Frame
    tb = slide.shapes.add_textbox(left + Inches(0.12), top + Inches(0.10), width - Inches(0.24), height - Inches(0.20))
    tf = tb.text_frame
    tf.word_wrap = True

    if title:
        p0 = tf.paragraphs[0]
        p0.text = title.upper()
        p0.font.name = "Arial"
        p0.font.size = Pt(10.5)
        p0.font.bold = True
        p0.font.color.rgb = WHITE if is_dark else BLACK
        p0.space_after = Pt(4)

    for idx, item in enumerate(items):
        p = tf.add_paragraph() if (title or idx > 0) else tf.paragraphs[0]
        p.space_after = Pt(3)

        if isinstance(item, tuple):
            head, body = item
            if head:
                r_h = p.add_run()
                r_h.text = head + ": "
                r_h.font.name = "Arial"
                r_h.font.size = Pt(8.8)
                r_h.font.bold = True
                r_h.font.color.rgb = WHITE if is_dark else BLACK

            r_b = p.add_run()
            r_b.text = body
            r_b.font.name = "Arial"
            r_b.font.size = Pt(8.4)
            r_b.font.bold = False
            r_b.font.color.rgb = RGBColor(220, 220, 220) if is_dark else DARK_GRAY
        else:
            r = p.add_run()
            r.text = item
            r.font.name = "Arial"
            r.font.size = Pt(8.4)
            r.font.bold = False
            r.font.color.rgb = RGBColor(220, 220, 220) if is_dark else DARK_GRAY

    return card

def add_bw_split_slide(prs, title, slide_num, intro_text, items, img_path, img_caption):
    """Draws a split 2-column slide with Black & White screenshot frame."""
    slide = create_bw_slide(prs, title, slide_num)

    left_w = Inches(4.35)
    left_t = Inches(1.1)

    # Left text box inside a B&W card
    card_items = []
    for itm in items:
        if isinstance(itm, tuple):
            card_items.append(itm)
        else:
            card_items.append(("", itm))

    add_bw_card(slide, Inches(0.55), left_t, left_w, Inches(3.8), intro_text, card_items)

    # Right Screenshot Frame with Retro Drop Shadow
    r_left = Inches(5.15)
    r_top = Inches(1.1)
    r_w = Inches(4.3)
    r_h = Inches(3.8)

    # Drop shadow for screenshot
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, r_left + Inches(0.04), r_top + Inches(0.04), r_w, r_h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = BLACK
    sh.line.fill.background()

    # Outer border frame
    frame = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, r_left, r_top, r_w, r_h)
    frame.fill.solid()
    frame.fill.fore_color.rgb = BLACK
    frame.line.color.rgb = BLACK
    frame.line.width = Pt(2.0)

    # Top Bar with 3 dots & caption
    tb_bar = slide.shapes.add_textbox(r_left + Inches(0.08), r_top + Inches(0.03), r_w - Inches(0.16), Inches(0.3))
    tf_bar = tb_bar.text_frame
    p_bar = tf_bar.paragraphs[0]
    p_bar.text = f"● ● ●  {img_caption}"
    p_bar.font.name = "Consolas"
    p_bar.font.size = Pt(7.5)
    p_bar.font.bold = True
    p_bar.font.color.rgb = WHITE

    # Insert Picture
    if os.path.exists(img_path):
        slide.shapes.add_picture(img_path, r_left + Inches(0.04), r_top + Inches(0.32), width=r_w - Inches(0.08), height=r_h - Inches(0.36))

    return slide

def add_bw_grid_4(prs, title, slide_num, cards):
    """Draws a 2x2 grid of Black & White retro cards."""
    slide = create_bw_slide(prs, title, slide_num)

    positions = [
        (Inches(0.55), Inches(1.12), Inches(4.3), Inches(1.85)), # TL
        (Inches(5.15), Inches(1.12), Inches(4.3), Inches(1.85)), # TR
        (Inches(0.55), Inches(3.12), Inches(4.3), Inches(1.85)), # BL
        (Inches(5.15), Inches(3.12), Inches(4.3), Inches(1.85)), # BR
    ]

    for idx, (c_title, c_items) in enumerate(cards):
        l, t, w, h = positions[idx]
        add_bw_card(slide, l, t, w, h, c_title, c_items)

    return slide

def build_all_bw_presentation():
    print(f"Loading official BIGCE template from: {INPUT_PPTX}")
    prs = pptx.Presentation(INPUT_PPTX)

    # Slide 1: Official Card 1
    print("Updating Slide 1: Official College Card 1...")
    update_slide_1(prs.slides[0])

    # Slide 2: THE PROBLEM STATEMENT (s-2)
    print("Adding Slide 2: Problem Statement...")
    s2_cards = [
        ("1. COST & COMPLEXITY TRAP", [
            ("Traditional Stacks", "Postgres + Redis + Docker requires expensive $20-$50/month VPS to run reliably."),
            ("Cloud BaaS Billing", "Firebase and AWS Amplify meter every single read and write, causing surprise bills."),
            ("DevOps Tax", "Managing VPCs, connection pooling, and SSL certificates slows down solo developers.")
        ]),
        ("2. HEAVY RAM CONSUMPTION", [
            ("Container Bloat", "Multi-tier microservices idle at 1.5GB to 3GB RAM before serving a single user."),
            ("Resource Starvation", "Cheap VPS instances crash from out-of-memory (OOM) killer under burst traffic."),
            ("MiniBase Edge", "MiniBase runs on ~35MB RAM, fitting easily on a $3 VPS or Raspberry Pi.")
        ]),
        ("3. NETWORK LATENCY & IPC HOPS", [
            ("Remote Socket Delay", "Connecting to a remote cloud DB adds 5ms-20ms network latency per query."),
            ("Sequential Roundtrips", "Complex dashboards requiring 10 queries can take 200ms+ just in wire transit."),
            ("In-Process WAL", "MiniBase's in-process memory execution resolves queries in microsecond speed.")
        ]),
        ("4. VENDOR LOCK-IN & DATA PRIVACY", [
            ("Proprietary APIs", "Migrating away from Firebase Firestore requires a complete backend rewrite."),
            ("Third-Party Data Storage", "Sensitive customer data sits on US corporate multi-tenant clouds."),
            ("Data Sovereignty", "MiniBase gives you 100% data ownership in a single local portable 'data.db'.")
        ])
    ]
    add_bw_grid_4(prs, "THE PROBLEM: BACKEND COMPLEXITY IN MODERN DEV", 2, s2_cards)

    # Slide 3: WHAT IS MINIBASE? (s-3)
    print("Adding Slide 3: What is MiniBase?...")
    add_bw_split_slide(
        prs,
        "WHAT IS MINIBASE? — CORE ARCHITECTURE",
        3,
        "EMBEDDED NODE.JS BACKEND-AS-A-SERVICE",
        [
            ("Core Philosophy", "MiniBase is an embedded, single-binary Backend-as-a-Service built on Node 22's native SQLite engine running in high-concurrency WAL mode."),
            ("All-in-One Engine", "Bundles Automated REST APIs, Real-time SSE Streams, File Storage, and a Visual Admin Studio into a single lightweight process."),
            ("Zero External Database", "Everything is stored in a single local 'data.db' file. No Docker, PostgreSQL, or Redis required."),
            ("Microsecond Latency", "In-process memory execution delivers 10x-50x faster read performance than network databases."),
            ("Ultra-Low Footprint", "Runs comfortably on ~35MB RAM on any cheap VPS or embedded hardware.")
        ],
        IMAGES['admin_studio'],
        "Admin Studio - Visual Collections & Record Manager"
    )

    # Slide 4: KEY ARCHITECTURAL FEATURES (s-4)
    print("Adding Slide 4: Key Features...")
    s4_cards = [
        ("HIGH-PERFORMANCE SQLITE WAL", [
            ("WAL Mode", "Write-Ahead Logging allows infinite concurrent readers while writing."),
            ("Zero IPC Overhead", "In-process memory execution eliminates TCP network hops."),
            ("Single-File Integrity", "Complete database stored in a single portable 'data.db' file.")
        ]),
        ("AUTOMATED RESTful API ENGINE", [
            ("Zero-Boilerplate", "Creating a table instantly exposes complete REST endpoints."),
            ("Rich Filtering", "Built-in '?filter=', '?sort=', and pagination out of the box."),
            ("OpenAPI Standards", "Automatic schema synchronization with interactive Swagger UI.")
        ]),
        ("REAL-TIME EVENT HUB (SSE)", [
            ("Server-Sent Events", "Push real-time record updates over standard HTTP."),
            ("Low Overhead", "10,000+ live concurrent streams on less than 60MB RAM."),
            ("Auto-Reconnect", "Native browser 'EventSource' handles reconnections seamlessly.")
        ]),
        ("BUILT-IN ASSET STORAGE PIPELINE", [
            ("Multipart Uploads", "Streaming file uploads partitioned per collection."),
            ("Sharp Optimization", "On-the-fly thumbnail generation for high-res images."),
            ("Security Hardened", "Mime-type inspection and path traversal sanitization.")
        ])
    ]
    add_bw_grid_4(prs, "KEY ARCHITECTURAL FEATURES & CAPABILITIES", 4, s4_cards)

    # Slide 5: SYSTEM ARCHITECTURE (s-5)
    print("Adding Slide 5: System Architecture...")
    s5_layers = [
        ("TIER 1: CLIENT APPLICATIONS (WEB, MOBILE, CLI)", [
            ("Web Clients", "React, Vue, Svelte, or Vanilla JS calling REST API endpoints and listening to SSE streams."),
            ("Mobile Apps", "Flutter & React Native integrating live real-time sync with zero external SDK bloat."),
            ("Administrative CLI", "Headless terminal utilities for admin creation, database seeding, and table inspection.")
        ]),
        ("TIER 2: HTTP DISPATCHER & CORE BAAS ENGINE", [
            ("Native Node 22 Router", "Zero-overhead routing engine with CORS headers and JWT authentication guard."),
            ("Auto CRUD Controller", "Dynamic query builder with 100% parameterized statement safety against SQL injection."),
            ("SSE Event Hub", "In-memory pub/sub event bus streaming record mutations to connected client sockets.")
        ]),
        ("TIER 3: PERSISTENCE & MEDIA STORAGE LAYER", [
            ("node:sqlite Core", "WAL journal mode, 64MB shared page cache, microsecond memory execution."),
            ("Local File Storage", "Disk-backed file uploads partitioned by collection name with Sharp thumbnails."),
            ("Admin Studio SPA", "Pre-compiled single-page application served directly from server memory.")
        ])
    ]
    s5_slide = create_bw_slide(prs, "SYSTEM ARCHITECTURE & END-TO-END DATA FLOW", 5)
    for idx, (l_t, l_items) in enumerate(s5_layers):
        add_bw_card(s5_slide, Inches(0.55), Inches(1.15 + idx * 1.3), Inches(8.9), Inches(1.18), l_t, l_items)

    # Slide 6: TECHNOLOGY STACK (s-6)
    print("Adding Slide 6: Technology Stack...")
    s6_cards = [
        ("CORE RUNTIME & DATABASE", [
            ("Node.js 22 LTS", "Native V8 JavaScript runtime delivering ultra-low memory usage."),
            ("node:sqlite Built-in", "Zero-dependency native C++ SQLite bindings built into Node 22."),
            ("WAL Journaling", "Write-Ahead Logging Pragma with shared memory page cache.")
        ]),
        ("NETWORKING & API TRANSPORT", [
            ("Native Node HTTP", "Zero-framework overhead; sub-millisecond route dispatching."),
            ("Server-Sent Events", "Standard HTTP text/event-stream for real-time synchronization."),
            ("OpenAPI 3.0", "Auto-generated Swagger documentation interface.")
        ]),
        ("IMAGE & ASSET PROCESSING", [
            ("Sharp Library", "High-performance C++ Libvips bindings for blazingly fast image resizing."),
            ("Multipart Streaming", "Stream uploads directly to disk without saturating process RAM."),
            ("WebP / JPEG Pipeline", "Automatic responsive thumbnail generation on demand.")
        ]),
        ("SECURITY & AUTHENTICATION", [
            ("Argon2 / bcrypt", "Cryptographically salted password hashing with high work factor."),
            ("Stateless JWT", "HMAC-SHA256 signed JSON Web Tokens for API and Admin auth."),
            ("Role-Based Access", "Granular API permission rules for public, user, and admin access.")
        ])
    ]
    add_bw_grid_4(prs, "TECHNOLOGY STACK & RUNTIME FOUNDATIONS", 6, s6_cards)

    # Slide 7: FIREBASE VS MINIBASE (s-7)
    print("Adding Slide 7: Comparison Table...")
    s7_slide = create_bw_slide(prs, "ARCHITECTURAL COMPARISON: FIREBASE VS MINIBASE", 7)
    rows_data = [
        ("Feature / Metric", "MiniBase", "PocketBase", "Supabase", "Firebase"),
        ("Underlying Database", "Native SQLite (WAL)", "Go SQLite", "PostgreSQL Server", "Google Cloud NoSQL"),
        ("Runtime Engine", "Node.js 22 Built-in", "Compiled Golang", "Postgres + Node + Go", "Proprietary Cloud"),
        ("Monthly Hosting Cost", "$0 / Self-Hosted", "$0 / Self-Hosted", "$25+/mo or heavy self-host", "Metered ($$$ Trap)"),
        ("Idle RAM Footprint", "~35 MB", "~30 MB", "~1.5 GB - 3 GB", "N/A (Cloud Hosted)"),
        ("Real-Time Protocol", "Server-Sent Events (SSE)", "Server-Sent Events", "WebSockets (Realtime)", "WebSockets"),
        ("Embedded Admin Studio", "Built-In (Pre-bundled)", "Built-In", "Heavy Web Dashboard", "Google Cloud Console"),
        ("Portability / Backup", "Single 'data.db' file", "Single 'data.db' file", "Complex pg_dump", "Proprietary Export"),
        ("Native JS Extensibility", "100% Native JS / Node", "Go Code / JS VM", "PL/pgSQL Functions", "Firebase Functions")
    ]
    tbl_shape = s7_slide.shapes.add_table(len(rows_data), 5, Inches(0.55), Inches(1.15), Inches(8.9), Inches(3.7))
    tbl = tbl_shape.table
    tbl.columns[0].width = Inches(2.3)
    tbl.columns[1].width = Inches(1.75)
    tbl.columns[2].width = Inches(1.6)
    tbl.columns[3].width = Inches(1.6)
    tbl.columns[4].width = Inches(1.65)

    for r_idx, row in enumerate(rows_data):
        for c_idx, val in enumerate(row):
            cell = tbl.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT
            p.font.name = "Arial"
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = BLACK
                p.font.size = Pt(9.5)
                p.font.bold = True
                p.font.color.rgb = WHITE
            else:
                cell.fill.solid()
                if c_idx == 1:
                    cell.fill.fore_color.rgb = RGBColor(230, 230, 230) if r_idx % 2 == 1 else WHITE
                    p.font.bold = True
                    p.font.color.rgb = BLACK
                else:
                    cell.fill.fore_color.rgb = LIGHT_GRAY if r_idx % 2 == 1 else WHITE
                    p.font.color.rgb = DARK_GRAY
                p.font.size = Pt(8.5)

    # Slide 8: ADMIN STUDIO CONSOLE (s-8)
    print("Adding Slide 8: Admin Studio Console...")
    add_bw_split_slide(
        prs,
        "VISUAL ADMIN STUDIO CONSOLE",
        8,
        "EMBEDDED WEB MANAGEMENT GUI",
        [
            ("Served at /_/", "MiniBase includes an embedded graphical management studio served automatically at 'http://localhost:8090/_/'."),
            ("Visual Schema Designer", "Add collections, define string/number/bool/file fields, and set unique constraints without writing SQL."),
            ("Inline Spreadsheet Editor", "Inspect, filter, search, sort, and edit records directly in a clean table interface."),
            ("Admin Account Controls", "Manage admin credentials, create superusers, and rotate secret keys."),
            ("Zero External Build", "Pre-bundled single-page application served directly from server memory.")
        ],
        IMAGES['admins_modal'],
        "Admin Studio - Admin Credentials & Security Modal"
    )

    # Slide 9: DYNAMIC REST API & DOCS (s-9)
    print("Adding Slide 9: Swagger Docs...")
    add_bw_split_slide(
        prs,
        "DYNAMIC REST API & INTERACTIVE DOCS",
        9,
        "OPENAPI / SWAGGER DOCUMENTATION",
        [
            ("Served at /docs", "Interactive OpenAPI specification and Swagger UI automatically generated for all collections."),
            ("Live Testing UI", "Execute GET, POST, PATCH, and DELETE requests directly from the browser window."),
            ("Zero Boilerplate", "Endpoints automatically adapt whenever collections or fields are modified."),
            ("Ready-to-Use Snippets", "Provides copy-paste code snippets for cURL, JavaScript Fetch, and Python requests."),
            ("JWT Auth Integration", "Authorize Swagger sessions with Bearer JWT tokens for testing protected endpoints.")
        ],
        IMAGES['api_docs'],
        "Swagger UI - Interactive API Documentation"
    )

    # Slide 10: TERMINAL CLI SUITE (s-10)
    print("Adding Slide 10: Terminal CLI...")
    add_bw_split_slide(
        prs,
        "TERMINAL CLI & ADMINISTRATIVE TOOLING",
        10,
        "HEADLESS TERMINAL MANAGEMENT",
        [
            ("node minibase.js", "Full-featured interactive command-line interface for headless server management."),
            ("Admin Account Creation", "Run 'admin create' to generate new superusers securely without opening a browser."),
            ("Database Seeding", "Automated mock data generator to populate tables with thousands of test records."),
            ("Table & Schema Inspector", "Display database tables, column types, row counts, and disk usage in formatted CLI tables."),
            ("Migration Runner", "Execute custom SQL migration scripts with automatic transactional rollback.")
        ],
        IMAGES['cli_suite'],
        "Terminal CLI - Interactive Server Management"
    )

    # Slide 11: AUTH & SECURITY (s-11)
    print("Adding Slide 11: Auth & Security...")
    add_bw_split_slide(
        prs,
        "AUTHENTICATION & SECURITY ARCHITECTURE",
        11,
        "STATENESS JWT & CRYPTOGRAPHIC SECURITY",
        [
            ("Argon2 / bcrypt Hashing", "Zero plain-text password storage; hashed using modern cryptographic algorithms with high work factor."),
            ("Stateless JWT Tokens", "Cryptographically signed JSON Web Tokens for client and admin authentication."),
            ("Role-Based Access Control", "Granular access rules per collection: Public Read, Authenticated Write, Admin Only."),
            ("CORS & Security Headers", "Built-in protection against Cross-Origin Request Forgery and malicious script injection."),
            ("SQL Injection Immune", "100% of incoming parameters bound using SQLite native prepared statements.")
        ],
        IMAGES['auth_portal'],
        "User Authentication Portal & Session Control"
    )

    # Slide 12: MIGRATION & BACKUPS (s-12)
    print("Adding Slide 12: Migration & Backups...")
    add_bw_split_slide(
        prs,
        "DATA MIGRATION & BACKUP ARCHITECTURE",
        12,
        "IMPORT, EXPORT & DISASTER RECOVERY",
        [
            ("CSV / JSON Importer", "Upload raw CSV or JSON files to automatically create tables and import bulk records."),
            ("Auto Schema Detection", "Infers column data types (Integer, Real, Text, Boolean) automatically from CSV content."),
            ("Single-File Snapshot", "Backing up the entire database is as simple as copying 'data.db' to an offsite location."),
            ("Instant Restoration", "Disaster recovery takes seconds: simply restore the 'data.db' file and restart."),
            ("Litestream Ready", "Supports streaming WAL replication to S3 or Cloudflare R2 for zero data loss.")
        ],
        IMAGES['import_export'],
        "Admin Studio - CSV & JSON Import/Export Modal"
    )

    # Slide 13: MULTI-PLATFORM CLIENT CODE (s-13)
    print("Adding Slide 13: Client Code...")
    s13_slide = create_bw_slide(prs, "MULTI-PLATFORM CLIENT INTEGRATION CODE", 13)
    # JS Snippet
    js_code = [
        ("// JAVASCRIPT / WEB FETCH & SSE", ""),
        ("// 1. Fetch records with filtering", ""),
        ("const res = await fetch('/api/collections/posts/records?filter=status=\"active\"');", ""),
        ("const { items } = await res.json();", ""),
        ("", ""),
        ("// 2. Listen to real-time updates via SSE", ""),
        ("const events = new EventSource('/api/realtime?table=posts');", ""),
        ("events.onmessage = (e) => {", ""),
        ("  const { action, record } = JSON.parse(e.data);", ""),
        ("  console.log(`Record ${action}:`, record);", ""),
        ("};", "")
    ]
    add_bw_card(s13_slide, Inches(0.55), Inches(1.15), Inches(4.3), Inches(3.7), "JAVASCRIPT / BROWSER CLIENT", js_code, is_dark=True)

    # Flutter / Dart Snippet
    dart_code = [
        ("// DART / FLUTTER MOBILE CLIENT", ""),
        ("// 1. Query records via HTTP REST", ""),
        ("final url = Uri.parse('$baseUrl/api/collections/posts/records');", ""),
        ("final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});", ""),
        ("final data = jsonDecode(res.body)['items'];", ""),
        ("", ""),
        ("// 2. Connect to Real-time EventSource", ""),
        ("final sse = EventSource.connect('$baseUrl/api/realtime');", ""),
        ("sse.then((stream) => stream.listen((event) {", ""),
        ("  final update = jsonDecode(event.data);", ""),
        ("  setState(() => posts.add(update['record']));", ""),
        ("}));", "")
    ]
    add_bw_card(s13_slide, Inches(5.15), Inches(1.15), Inches(4.3), Inches(3.7), "DART / FLUTTER MOBILE CLIENT", dart_code, is_dark=True)

    # Slide 14: DEMO APP — WALLPAPER GALLERY (s-14)
    print("Adding Slide 14: Demo App...")
    add_bw_split_slide(
        prs,
        "FULL-STACK DEMO APP: WALLPAPER GALLERY",
        14,
        "PRODUCTION DEMONSTRATION APP",
        [
            ("Served at /demo", "Full-stack demonstration application showcasing all MiniBase capabilities in a live production setting."),
            ("Multipart File Uploads", "Uploads high-resolution wallpapers with automatic Sharp thumbnail generation."),
            ("Dynamic REST Filtering", "Instant client-side category filtering, search queries, and microsecond pagination."),
            ("Live SSE Real-Time Sync", "Uploading a wallpaper in Admin Studio immediately updates all connected clients without refresh."),
            ("Flutter Mobile Included", "Complete responsive web app and cross-platform Flutter mobile client.")
        ],
        IMAGES['demo_app'],
        "Demo Application - Live Wallpaper Gallery Client"
    )

    # Slide 15: REAL-WORLD APPLICATIONS (s-15)
    print("Adding Slide 15: Applications...")
    s15_cards = [
        ("1. LOCAL DESKTOP & OFFLINE-FIRST APPS", [
            ("Embedded Sidecar", "Ship MiniBase as an embedded sidecar binary inside Electron or Tauri desktop software."),
            ("Zero Cloud Dependency", "Desktop applications run 100% offline with zero cloud server requirements."),
            ("Local REST Protocol", "Desktop UI communicates with MiniBase over localhost HTTP just like a cloud app.")
        ]),
        ("2. INTERNAL ENTERPRISE TOOLS & CRMs", [
            ("Rapid Deployment", "Build inventory trackers, staff directories, and CRM dashboards in minutes."),
            ("Zero DBA Required", "Non-technical teams manage data through the visual Admin Studio with zero SQL knowledge."),
            ("On-Premise Ready", "Deploy on private corporate networks behind firewalls with zero external cloud dependencies.")
        ]),
        ("3. IOT, EDGE & EMBEDDED COMPUTING", [
            ("Ultra-Low Footprint", "Runs comfortably on ~35MB RAM on Raspberry Pi, edge gateways, and industrial hardware."),
            ("Crash Resilient", "SQLite WAL handles unexpected power cuts without database corruption."),
            ("Local Sensor Ingestion", "Ingests thousands of sensor data points per second with microsecond writes.")
        ]),
        ("4. RAPID STARTUP MVPs & HACKATHONS", [
            ("Accelerated Shipping", "Frontend engineers build complete SaaS apps without writing backend boilerplate."),
            ("Free Self-Hosting", "Run the entire backend on a free $0/mo Oracle Cloud or $3/mo Hetzner VPS."),
            ("Production Scalability", "Easily handles up to 50,000+ daily active users on a single modern VPS.")
        ])
    ]
    add_bw_grid_4(prs, "REAL-WORLD APPLICATIONS & TARGET USE CASES", 15, s15_cards)

    # Slide 16: KEY ADVANTAGES & BENEFITS (s-16)
    print("Adding Slide 16: Advantages...")
    s16_cards = [
        ("ZERO HOSTING COSTS ($0 CLOUD BILLS)", [
            ("No Meter Traps", "Zero per-query fees, no read/write quotas, and no bandwidth surprise bills."),
            ("Cheap Hardware Friendly", "Runs effortlessly on any inexpensive VPS, home server, or old laptop."),
            ("Predictable Budget", "Fixed $3-$5 monthly VPS cost regardless of whether you serve 1,000 or 1,000,000 requests.")
        ]),
        ("MICROSECOND IN-PROCESS LATENCY", [
            ("No Network Hops", "Application server and database share the same process memory space."),
            ("Sub-Millisecond Queries", "Simple lookups execute in 10-50 microseconds, 10x-50x faster than remote PostgreSQL."),
            ("High Read Throughput", "Handles thousands of read requests per second on a single CPU core.")
        ]),
        ("100% DATA SOVEREIGNTY & PRIVACY", [
            ("Absolute Ownership", "Data never leaves your server; zero sharing with third-party cloud vendors."),
            ("GDPR / HIPAA Compliant", "Guarantees complete compliance with strict healthcare and European privacy laws."),
            ("Effortless Auditing", "Easily backup, encrypt, inspect, or copy raw SQLite database files.")
        ]),
        ("ZERO-CONFIG PORTABLE DEPLOYMENT", [
            ("Single Binary Deployment", "No database daemons, connection pools, or environment variables to configure."),
            ("Git Clone & Run", "Clone the repository, run 'npm install', and the entire backend is live."),
            ("Disaster Recovery", "Restoring a backup takes 2 seconds: simply copy the 'data.db' file into place.")
        ])
    ]
    add_bw_grid_4(prs, "KEY ADVANTAGES & STRATEGIC STRENGTHS", 16, s16_cards)

    # Slide 17: LIMITATIONS & WHEN NOT TO USE (s-17)
    print("Adding Slide 17: Limitations...")
    s17_cards = [
        ("SINGLE-NODE VERTICAL SCALING", [
            ("Local SQLite Architecture", "MiniBase is architected for single-server vertical scaling (adding CPU/RAM)."),
            ("No Multi-Region Distributed Writes", "Cannot span write transactions across geographically distributed multi-datacenter clusters."),
            ("When NOT to Use", "Do not choose MiniBase for global multi-region active-active distributed databases.")
        ]),
        ("NOT DESIGNED FOR MASSIVE BIG DATA (TERABYTE+)", [
            ("Optimal Range", "SQLite performs flawlessly up to 50GB-100GB and tens of millions of rows."),
            ("Analytical Limitations", "Complex OLAP analytical queries across hundreds of gigabytes are slow compared to ClickHouse."),
            ("When NOT to Use", "Avoid for petabyte-scale data warehousing or massive event analytics pipelines.")
        ]),
        ("WRITE CONCURRENCY LOCK BOTTLENECK", [
            ("Sequential Commit Model", "In SQLite WAL mode, concurrent reads are infinite, but write transactions commit sequentially."),
            ("Heavy Write Floods", "Sustained workloads with >2,000 continuous writes per second will queue up lock contention."),
            ("When NOT to Use", "Avoid for high-frequency stock trading engines or high-write telemetry logging.")
        ]),
        ("NO NATIVE MOBILE PUSH NOTIFICATIONS", [
            ("SSE Focus", "MiniBase provides live HTTP Server-Sent Events, ideal for open browser tabs and active apps."),
            ("External Services Required", "Background wake-up push notifications for closed iOS/Android apps require Apple APNS or Firebase FCM."),
            ("When NOT to Use", "Mobile apps must integrate a third-party push gateway for device sleep notifications.")
        ])
    ]
    add_bw_grid_4(prs, "LIMITATIONS & WHEN NOT TO USE MINIBASE", 17, s17_cards)

    # Slide 18: ROADMAP & FUTURE VISION (s-18)
    print("Adding Slide 18: Roadmap...")
    s18_cards = [
        ("LITESTREAM CONTINUOUS REPLICATION", [
            ("Disaster Recovery", "Automated streaming WAL replication to Amazon S3, Cloudflare R2, or MinIO."),
            ("Zero Data Loss", "Continuously replicates SQLite transactions in microsecond intervals."),
            ("Live Read Replicas", "Spins up read-only edge replicas worldwide backed by the primary S3 stream.")
        ]),
        ("SERVER-SIDE JS HOOKS & PLUGIN SYSTEM", [
            ("Lifecycle Interceptors", "Execute custom JS logic before or after record creation: 'onRecordCreate()', 'beforeAuth()'."),
            ("Payment Webhooks", "Integrate Stripe, Razorpay, and PayPal webhooks directly inside MiniBase."),
            ("Email & SMS Triggers", "Automated transactional email dispatch on user registration and password resets.")
        ]),
        ("DEDICATED NATIVE SDK ECOSYSTEM", [
            ("minibase-js", "TypeScript-first SDK published to npm with automated typing for collections."),
            ("minibase_flutter", "Native Dart client on pub.dev with built-in offline caching and SSE sync."),
            ("minibase-python", "Lightweight Python package on PyPI for data science and AI pipeline ingestion.")
        ]),
        ("OAUTH2 SOCIAL LOGIN PROVIDERS", [
            ("One-Click Auth", "Direct integrations with Google, GitHub, Apple, and Discord authentication."),
            ("Studio Configuration", "Manage client IDs, secrets, and callback URLs directly from Admin Studio."),
            ("PKCE Security", "Implements Proof Key for Code Exchange for secure mobile client logins.")
        ])
    ]
    add_bw_grid_4(prs, "PROJECT ROADMAP & FUTURE VISION", 18, s18_cards)

    # Slide 19: QUICKSTART & DEPLOYMENT (s-19)
    print("Adding Slide 19: Quickstart...")
    s19_slide = create_bw_slide(prs, "QUICKSTART, SETUP & PRODUCTION DEPLOYMENT", 19)
    # Quickstart Box
    qs_code = [
        ("# 1. CLONE THE REPOSITORY", ""),
        ("git clone https://github.com/kothalkarkkartik/MiniBase.git", ""),
        ("cd MiniBase", ""),
        ("", ""),
        ("# 2. INSTALL DEPENDENCIES (ZERO NATIVE BUILDS)", ""),
        ("npm install", ""),
        ("", ""),
        ("# 3. START MINIBASE SERVER (DEFAULT PORT: 8090)", ""),
        ("node minibase.js serve", ""),
        ("", ""),
        ("# 4. CREATE INITIAL ADMIN SUPERUSER ACCOUNT", ""),
        ("node minibase.js admin create --email admin@minibase.io --password password123", "")
    ]
    add_bw_card(s19_slide, Inches(0.55), Inches(1.15), Inches(5.1), Inches(3.7), "QUICKSTART COMMANDS", qs_code, is_dark=True)

    # Production Tips Box
    prod_tips = [
        ("SYSTEMD SERVICE (LINUX VPS)", [
            ("Daemon Management", "Run as a systemd background service with automated restart on server reboot."),
            ("ExecStart Command", "ExecStart=/usr/bin/node /opt/minibase/minibase.js serve")
        ]),
        ("NGINX REVERSE PROXY & SSL", [
            ("Proxy Pass", "Forward port 80/443 traffic to localhost:8090."),
            ("Let's Encrypt", "Free SSL certificate automation with certbot --nginx."),
            ("SSE Buffer Off", "proxy_buffering off; for real-time Server-Sent Events.")
        ]),
        ("DOCKER SINGLE CONTAINER", [
            ("Alpine Image", "Single lightweight Dockerfile (~80MB total container size)."),
            ("Volume Mount", "Mount -v ./data:/app/data for persistent database storage.")
        ])
    ]
    # Draw right column cards
    for idx, (p_t, p_items) in enumerate(prod_tips):
        add_bw_card(s19_slide, Inches(5.85), Inches(1.15 + idx * 1.25), Inches(3.6), Inches(1.15), p_t, p_items)

    # Slide 20: SUMMARY & CONCLUSION (s-20)
    print("Adding Slide 20: Summary & Conclusion...")
    s20_slide = create_bw_slide(prs, "PROJECT SUMMARY, ARTIFACTS & EVALUATION", 20)
    add_bw_card(s20_slide, Inches(0.55), Inches(1.15), Inches(4.3), Inches(3.7), "SUMMARY OF ACHIEVEMENTS", [
        ("Embedded BaaS Architecture", "Successfully engineered a self-contained Backend-as-a-Service eliminating external database dependencies."),
        ("Blazing WAL Performance", "Demonstrated microsecond read latency and verified 10,000+ concurrent SSE connections on ~35MB RAM."),
        ("Complete Developer Experience", "Delivered automated REST APIs, pre-bundled Admin Studio GUI, Swagger docs, and CLI suite in a single executable."),
        ("Academic Significance", "Demonstrates that modern Node 22 native primitives can outperform heavy multi-container stacks for small-to-medium systems.")
    ])

    # Right Box: Dark Thank You Card with Retro Shadow
    add_bw_card(s20_slide, Inches(5.15), Inches(1.15), Inches(4.3), Inches(3.7), "THANK YOU!", [
        ("OPEN FOR EVALUATION", "Questions, Feedback & Contributions are Welcome!"),
        ("", ""),
        ("Candidate", "Kartik Kishor Kothalkar (Regular Batch)"),
        ("PRN No", "23062191242009 | Dept. of CSE"),
        ("", ""),
        ("Project Guide", "Prof. Anand R. Gyanbote"),
        ("Designation", "Head of Department, Dept. of CSE"),
        ("Institution", "Bharat Ratna Indira Gandhi College of Engineering, Solapur"),
        ("", ""),
        ("GitHub Repository", "github.com/kothalkarkkartik/MiniBase")
    ], is_dark=True)

    # Save outputs
    print(f"Saving presentation to: {OUTPUT_PPTX_DL}")
    prs.save(OUTPUT_PPTX_DL)

    print(f"Saving presentation to: {OUTPUT_PPTX_WS}")
    prs.save(OUTPUT_PPTX_WS)

    print(f"Saving presentation to brain artifact: {OUTPUT_PPTX_BRAIN}")
    prs.save(OUTPUT_PPTX_BRAIN)

    print("SUCCESS: 20-slide pure Black & White presentation generated successfully!")

if __name__ == '__main__':
    build_all_bw_presentation()
