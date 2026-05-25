(function () {
  "use strict";

  /* ===== Marked config: all links open in new window ===== */
  marked.use({
    renderer: {
      link: function (token) {
        var href = token.href;
        var title = token.title;
        var text = token.text;
        var titleAttr = title ? ' title="' + title + '"' : "";
        return '<a href="' + href + '" target="_blank" rel="noopener"' + titleAttr + '>' + text + '</a>';
      }
    }
  });

  /* ===== State ===== */
  var posts = [];
  var currentPage = 0;
  var PAGE_SIZE = 10;

  /* ===== DOM Refs ===== */
  var $viewList   = document.getElementById("view-list");
  var $viewPost   = document.getElementById("view-post");
  var $postList   = document.getElementById("postList");
  var $postDetail = document.getElementById("postDetail");

  /* ===== Init ===== */
  function init() {
    loadPosts().then(function () {
      route();
      window.addEventListener("hashchange", route);
    });
  }

  /* ===== Data Loading ===== */
  function loadPosts() {
    return fetch("posts/index.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        return Promise.all(data.map(function (entry) {
          return fetch("posts/" + entry.slug + ".md")
            .then(function (r) {
              if (!r.ok) throw new Error("Not found");
              return r.text();
            })
            .then(function (md) {
              return parsePostMeta(entry.slug, md, entry);
            })
            .catch(function (err) {
              console.error("Failed to load post: " + entry.slug, err);
              return null;
            });
        }));
      })
      .then(function (results) {
        posts = results.filter(Boolean);
        posts.sort(function (a, b) {
          return new Date(b.date) - new Date(a.date);
        });
        if (!posts.length) {
          posts = null;
        }
      })
      .catch(function (err) {
        posts = null;
        console.error("Failed to load posts:", err);
      });
  }

  function parsePostMeta(slug, md, entry) {
    var title = entry.title || "";
    var lines = md.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith("# ")) {
        title = line.slice(2).trim();
        break;
      }
    }

    var date = entry.date || "";
    if (!date) {
      var dateMatch = md.match(/<!--\s*date:\s*(\d{4}-\d{2}-\d{2})\s*-->/);
      if (dateMatch) date = dateMatch[1];
    }

    var summary = entry.summary || "";
    if (!summary) {
      var inContent = false;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith("# ")) { inContent = true; continue; }
        if (line.startsWith("<!--")) continue;
        if (line.startsWith("```")) continue;
        if (inContent && line && !line.startsWith("#") && !line.startsWith(">") && !line.startsWith("-") && !line.startsWith("|")) {
          summary = line
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/[*_`~#]/g, "")
            .trim();
          if (summary.length > 150) summary = summary.slice(0, 150) + "...";
          break;
        }
      }
    }

    var content = md.replace(/^<!--[\s\S]*?-->\s*/m, "");
    content = content.replace(/^# .*\n?/, "").trim();

    return {
      slug: slug,
      title: title || slug,
      date: date || "1970-01-01",
      summary: summary,
      content: content
    };
  }

  /* ===== Router ===== */
  function route() {
    var hash = decodeURIComponent(location.hash.slice(1) || "/");

    if (hash === "/" || hash === "") {
      showList();
    } else if (hash.startsWith("/post/")) {
      showPost(hash.slice(6));
    } else {
      showList();
    }
  }

  /* ===== View Switching ===== */
  function hideAll() {
    $viewList.classList.add("hidden");
    $viewPost.classList.add("hidden");
  }

  /* ===== List View ===== */
  function showList() {
    hideAll();
    $viewList.classList.remove("hidden");
    document.title = "Bookie";

    if (posts === null) {
      $postList.innerHTML =
        "<div class=\"empty-state\">" +
          "<p><strong>文章列表加载失败</strong></p>" +
          "<p style=\"margin-top:0.8em;\">你可能直接用浏览器打开了 <code>index.html</code>，浏览器会阻止本地文件请求。</p>" +
          "<p style=\"margin-top:0.5em;\">请使用本地服务器预览：</p>" +
          "<pre style=\"background:#f5f5f5;padding:0.6em 1em;border-radius:4px;display:inline-block;text-align:left;font-size:0.85rem;margin-top:0.5em;\">cd Bookie\npython -m http.server 8080</pre>" +
          "<p style=\"margin-top:0.8em;\">然后访问 <a href=\"http://localhost:8080\" style=\"color:#2c2c2c;\">http://localhost:8080</a></p>" +
        "</div>";
      return;
    }

    if (!posts.length) {
      $postList.innerHTML = "<div class=\"empty-state\">还没有文章，敬请期待。</div>";
      return;
    }

    var totalPages = Math.ceil(posts.length / PAGE_SIZE);
    if (currentPage >= totalPages) currentPage = 0;

    var start = currentPage * PAGE_SIZE;
    var pagePosts = posts.slice(start, start + PAGE_SIZE);

    var html = pagePosts.map(function (p) {
      return (
        "<div class=\"post-item\">" +
          "<a class=\"post-item-title\" href=\"#/post/" + encodeURIComponent(p.slug) + "\">" + escHtml(p.title) + "</a>" +
          "<div class=\"post-item-meta\">" +
            "<span>" + formatDate(p.date) + "</span>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    if (totalPages > 1) {
      html += "<div class=\"pagination\">";
      if (currentPage > 0) {
        html += "<a class=\"pagination-btn\" href=\"javascript:void(0)\" data-page=\"" + (currentPage - 1) + "\">上一页</a>";
      } else {
        html += "<span class=\"pagination-btn disabled\">上一页</span>";
      }
      html += "<span class=\"pagination-info\">第 " + (currentPage + 1) + " / " + totalPages + " 页</span>";
      if (currentPage < totalPages - 1) {
        html += "<a class=\"pagination-btn\" href=\"javascript:void(0)\" data-page=\"" + (currentPage + 1) + "\">下一页</a>";
      } else {
        html += "<span class=\"pagination-btn disabled\">下一页</span>";
      }
      html += "</div>";
    }

    $postList.innerHTML = html;

    var btns = $postList.querySelectorAll(".pagination-btn[data-page]");
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          currentPage = parseInt(btn.getAttribute("data-page"));
          showList();
          window.scrollTo(0, 0);
        });
      })(btns[i]);
    }
  }

  /* ===== Post Detail View ===== */
  function showPost(slug) {
    hideAll();
    $viewPost.classList.remove("hidden");

    if (posts === null) {
      $postDetail.innerHTML = "<div class=\"empty-state\"><p>文章数据加载失败。</p><p style=\"margin-top:0.5em;\">请使用本地服务器打开：<code>python -m http.server 8080</code></p></div>";
      return;
    }

    var post = null;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].slug === slug) { post = posts[i]; break; }
    }

    if (!post) {
      $postDetail.innerHTML = "<div class=\"empty-state\">文章未找到。</div>";
      return;
    }

    document.title = post.title;

    $postDetail.innerHTML =
      "<div class=\"post-detail-header\">" +
        "<h1 class=\"post-detail-title\">" + escHtml(post.title) + "</h1>" +
        "<div class=\"post-detail-meta\">" + formatDate(post.date) + "</div>" +
      "</div>" +
      "<div class=\"post-content\">" + marked.parse(post.content) + "</div>";
  }

  /* ===== Helpers ===== */
  function escHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return d.getFullYear() + "-" +
      ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
      ("0" + d.getDate()).slice(-2);
  }

  /* ===== Boot ===== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();