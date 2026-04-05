import { jest } from "@jest/globals";
import { createMockRes, createNext } from "../../../test/httpMocks.js";

const Post = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const Comment = {
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
};

jest.unstable_mockModule("../../models/Post.js", () => ({ default: Post }));
jest.unstable_mockModule("../../models/Comment.js", () => ({ default: Comment }));
jest.unstable_mockModule("../../config/cloudinary.js", () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

const { getFeed, createPost, getPost } = await import("../postController.js");

describe("postController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getFeed returns public posts plus user's private posts with computed meta", async () => {
    const now = new Date("2026-04-06T00:00:00.000Z");
    const req = {
      query: {},
      user: { _id: "u1" },
    };
    const res = createMockRes();
    const next = createNext();

    const posts = [
      {
        _id: "p1",
        author: { firstName: "Ada", lastName: "Lovelace" },
        content: "Hello",
        visibility: "public",
        createdAt: now,
        likes: ["u1", "u2"],
      },
    ];

    const chain = {
      sort: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      populate: jest.fn(() => chain),
      lean: jest.fn(async () => posts),
    };

    Post.find.mockReturnValue(chain);
    Comment.aggregate.mockResolvedValueOnce([{ _id: "p1", count: 3 }]);

    await getFeed(req, res, next);

    expect(Post.find).toHaveBeenCalledWith({
      $or: [
        { visibility: "public" },
        { author: "u1", visibility: "private" },
      ],
    });

    expect(res.json).toHaveBeenCalledWith({
      posts: [
        expect.objectContaining({
          _id: "p1",
          likeCount: 2,
          commentCount: 3,
          isLiked: true,
        }),
      ],
      nextCursor: null,
      hasMore: false,
    });

    const payload = res.json.mock.calls[0][0];
    expect(payload.posts[0].likes).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it("createPost rejects when an image field is present but no file was parsed", async () => {
    const req = {
      headers: { "content-type": "application/json" },
      body: { content: "hello", visibility: "public", image: "" },
      user: { _id: "u1" },
      file: undefined,
    };
    const res = createMockRes();
    const next = createNext();

    await createPost(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
  });

  it("getPost blocks private posts for non-author", async () => {
    const req = { params: { id: "p1" }, user: { _id: "u2" } };
    const res = createMockRes();
    const next = createNext();

    Post.findById.mockReturnValueOnce({
      populate: jest.fn(async () => ({
        _id: "p1",
        visibility: "private",
        author: { _id: "u1", firstName: "Ada", lastName: "Lovelace" },
        likes: [],
        toObject() {
          return this;
        },
      })),
    });

    await getPost(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });
});
